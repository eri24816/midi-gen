import { Midi } from "@tonejs/midi/src/Midi";
import type { Piano } from "@tonejs/piano";
import { Buffer } from "buffer";
import { now } from "tone";

export function base64Encode(array: Uint8Array): string {
    return Buffer.from(array).toString("base64");
}

export function base64Decode(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, "base64"));
}

export function getBps(midi: Midi): number {
    if (midi.header.tempos.length > 0) {
        return midi.header.tempos[0].bpm / 60;
    } else {
        return 120 / 60;
    }
}

export class Note {
    onset: number;
    duration: number;
    pitch: number;
    velocity: number;

    constructor(
        onset: number,
        duration: number,
        pitch: number,
        velocity: number,
    ) {
        this.onset = onset;
        this.duration = duration;
        this.pitch = pitch;
        this.velocity = velocity;
    }

    equals(note: Note): boolean {
        return (
            this.onset === note.onset &&
            this.duration === note.duration &&
            this.pitch === note.pitch &&
            this.velocity === note.velocity
        );
    }
}

/**
 * A simpler subset of Midi data.
 * Only contains onsets of notes and their duration, pitch, and velocity.
 */
export class Pianoroll {
    private onsets: Note[];
    bps: number;
    private midiData: ArrayBuffer | null = null;
    private _duration: number = 0;
    get duration(): number {
        return this._duration;
    }

    constructor(midiData: ArrayBuffer | Uint8Array | null = null) {
        if (!midiData) {
            this.onsets = [];
            this.bps = 120 / 60;
            return;
        }
        this.midiData = midiData;

        const midi = new Midi(midiData);
        this.bps = getBps(midi);
        this.onsets = midi.tracks[0].notes.map(
            (note) =>
                new Note(
                    note.time * this.bps,
                    note.duration * this.bps,
                    note.midi,
                    note.velocity,
                ),
        );
        this.recalculateDuration();
    }

    toMidi(): Midi {
        const midi = new Midi();
        midi.addTrack();
        if (this.midiData) {
            const oldMidi = new Midi(this.midiData);
            midi.header = oldMidi.header;
        }
        midi.header.update();
        const ticksPerSecond = midi.header.secondsToTicks(1);
        this.bps = getBps(midi);

        for (const note of this.onsets) {
            // Do not use time/duration in the addNote function. It incorrectly calculates the ticks.
            midi.tracks[0].addNote({
                ticks: (note.onset / this.bps) * ticksPerSecond,
                durationTicks: (note.duration / this.bps) * ticksPerSecond,
                midi: note.pitch,
                velocity: note.velocity,
            });
        }
        return midi;
    }

    /**
     * Get notes that overlap with a time interval.
     * @param {number} start - The start beat.
     * @param {number} end - The end beat.
     * @returns {Note[]} An array of notes that are between the start and end beats.
     */
    getNotesBetween(start: number, end: number): Note[] {
        return this.onsets.filter(
            (note) => note.onset < end && note.onset + note.duration >= start,
        );
    }

    getNoteAt(beat: number, pitch: number): Note | null {
        const tmp =
            this.onsets.find(
                (note) =>
                    note.onset < beat &&
                    note.onset + note.duration > beat &&
                    note.pitch === pitch,
            ) || null;
        if (tmp) {
            return tmp;
        } else {
            return null;
        }
    }

    /**
     * Get notes that start between two beats.
     * @param {number} start - The start beat.
     * @param {number} end - The end beat.
     * @returns {Note[]} An array of notes that start between the start and end beats.
     */
    getNotesOnsetBetween(start: number, end: number): Note[] {
        return this.onsets.filter(
            (note) => note.onset < end && note.onset >= start,
        );
    }

    addNote(note: Note) {
        this.onsets.push(note);
        this._duration = Math.max(this._duration, note.onset + note.duration);
    }

    removeNote(note: Note) {
        this.onsets = this.onsets.filter((n) => !n.equals(note));
        this.recalculateDuration();
    }

    overlapWith(other: Pianoroll, shift: number = 0): void {
        for (const note of other.onsets) {
            this.addNote(
                new Note(
                    note.onset + shift,
                    note.duration,
                    note.pitch,
                    note.velocity,
                ),
            );
        }
    }

    slice(start: number, end: number, shift = false): Pianoroll {
        start -= 0.001;
        end -= 0.001;
        const sliced = new Pianoroll();
        sliced.onsets = this.onsets.filter(
            (note) => note.onset >= start && note.onset <= end,
        );
        // clone the notes
        sliced.onsets = sliced.onsets.map((note) => {
            return new Note(
                shift ? note.onset - start : note.onset,
                note.duration,
                note.pitch,
                note.velocity,
            );
        });

        sliced.recalculateDuration();
        return sliced;
    }

    removeSlice(start: number, end: number): void {
        start -= 0.001;
        end -= 0.001;
        this.onsets = this.onsets.filter(
            (note) => note.onset <= start || note.onset >= end,
        );
        this.recalculateDuration();
    }

    recalculateDuration(): void {
        if (this.onsets.length === 0) {
            this._duration = 0;
        } else
            this._duration = Math.max(
                ...this.onsets.map((note) => note.onset + note.duration),
            );
    }
}

/**
 * This class extends the functionality of the Piano class from `@tonejs/piano`.
 * It automatically do the key-up events for played notes based on their duration.
 */
export class AutoKeyupPiano {
    /** Map to store pending note offsets (pitch -> offset) */
    private pendingOffsets: Map<number, number> = new Map();

    /**
     * Creates an instance of AutoKeyupPiano.
     * @param {Piano} piano - The Piano instance to be wrapped.
     */
    constructor(public piano: Piano) {
        piano.load().then(() => {
            console.log("Piano loaded");
        });
        piano.toDestination();
    }

    /**
     * Plays a note and schedules its key-up event.
     * @param {Note} note - The note to be played.
     */
    playNote(onset: number, pitch: number, velocity: number, offset: number) {
        if (this.pendingOffsets.has(pitch)) {
            this.piano.keyUp({ midi: pitch, time: offset });
        }
        this.piano.keyDown({ midi: pitch, velocity: velocity, time: onset });
        this.pendingOffsets.set(pitch, offset);
    }

    playNoteImmediate(pitch: number, velocity: number) {
        this.piano.keyDown({ midi: pitch, velocity: velocity });
        this.pendingOffsets.set(pitch, now() + 5);
    }

    /**
     * Stops a note immediately.
     * @param {Note} note - The note to be stopped.
     */
    stopNote(note: Note) {
        this.piano.keyUp({ midi: note.pitch });
        this.pendingOffsets.delete(note.pitch);
    }

    /**
     * Updates the piano state, releasing keys that have reached their offset time.
     * @param {number} time - The current time.
     */
    update(time: number) {
        for (const [pitch, offset] of this.pendingOffsets.entries()) {
            if (time > offset) {
                this.piano.keyUp({ midi: pitch });
                this.pendingOffsets.delete(pitch);
            }
        }
    }

    /**
     * Stops all currently playing notes.
     */
    stop() {
        for (const [pitch, offset] of this.pendingOffsets.entries()) {
            this.piano.keyUp({ midi: pitch });
            this.pendingOffsets.delete(pitch);
        }
    }
}

export class CooldownDict {
    private cooldowns: { [key: string]: Cooldown } = {};

    constructor(private cooldownTime: number) {}

    request(key: string, cb: () => void) {
        if (!this.cooldowns[key]) {
            this.cooldowns[key] = new Cooldown(this.cooldownTime);
        }
        this.cooldowns[key].request(cb);
    }
}

export class Cooldown {
    // when request() is called, run the function when at least cooldown time has passed since the last call
    constructor(private cooldownTime: number) {}
    private lastCallTime: number = 0;
    private lastCallCb: () => void = () => {};
    private timeout: NodeJS.Timeout | null = null;

    request(cb: () => void) {
        const nowTime = Date.now() / 1000;
        if (nowTime - this.lastCallTime > this.cooldownTime) {
            this.lastCallTime = nowTime;
            cb();
        } else {
            this.lastCallCb = cb;
            if (this.timeout) {
                return;
            }
            this.timeout = setTimeout(
                () => {
                    this.lastCallTime = Date.now() / 1000;
                    this.lastCallCb();
                    this.timeout = null;
                },
                (this.cooldownTime - (nowTime - this.lastCallTime)) * 1000,
            );
        }
    }
}
