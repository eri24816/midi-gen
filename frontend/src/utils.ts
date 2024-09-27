import { Midi } from '@tonejs/midi';
import { Buffer } from 'buffer';

export function base64Encode(array: Uint8Array): string {
    return Buffer.from(array).toString('base64');
}

export function base64Decode(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function getBps(midi: Midi): number {
  if (midi.header.tempos.length > 0) {
    return midi.header.tempos[0].bpm/60;
  } else {
    return 120/60;
  }
}

export class Note {
  onset: number;
  duration: number;
  pitch: number;
  velocity: number;

  constructor(onset: number, duration: number, pitch: number, velocity: number) {
    this.onset = onset;
    this.duration = duration;
    this.pitch = pitch;
    this.velocity = velocity;
  }

  equals(note: Note): boolean {
    return this.onset === note.onset && this.duration === note.duration && this.pitch === note.pitch && this.velocity === note.velocity;
  }
}

/**
 * A simpler subset of Midi data.
 * Only contains onsets of notes and their duration, pitch, and velocity.
 */
export class Pianoroll{
  private onsets: Note[];
  bps: number;
  private midiData: ArrayBuffer|null = null;
  constructor(midiData: ArrayBuffer|null = null){
    if (!midiData) {
      this.onsets = [];
      this.bps = 120/60;
      return;
    }
    this.midiData = midiData;

    const midi = new Midi(midiData);
    this.bps = getBps(midi);
    this.onsets = midi.tracks[0].notes.map((note) => new Note(
      note.time  * this.bps,
      note.duration  * this.bps,
      note.midi,
      note.velocity
    ));
    let ticksPerSecond = midi.header.secondsToTicks(1);
    ticksPerSecond = midi.header.secondsToTicks(1);
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
        ticks: note.onset / this.bps * ticksPerSecond,
        durationTicks: note.duration / this.bps * ticksPerSecond,
        midi: note.pitch,
        velocity: note.velocity
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
    return this.onsets.filter((note) => note.onset < end && note.onset + note.duration >= start);
  }

  getNoteAt(beat: number, pitch: number): Note | null {
    const tmp =  this.onsets.find((note) => (note.onset < beat && (note.onset + note.duration > beat)) && note.pitch === pitch) || null;
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
    return this.onsets.filter((note) => note.onset < end && note.onset >= start);
  }

  addNote(note: Note) {
    this.onsets.push(note);
  }

  removeNote(note: Note) {
    this.onsets = this.onsets.filter((n) => !n.equals(note));
  }
}