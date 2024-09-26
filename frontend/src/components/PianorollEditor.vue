<template>
  <div class="pianoroll-editor">
    <canvas class="pianoroll-canvas" ref="pianorollCanvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @wheel="handleWheel" @dblclick="handleDoubleClick"></canvas>
    <div class="controls">
      <button @click="playMidi">Play</button>
      <button @click="stopMidi">Stop</button>
      <button @click="saveMidi">Save</button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Midi } from '@tonejs/midi';
import { Piano } from '@tonejs/piano'

class Note {
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
}

function getBps(midi: Midi): number {
  if (midi.header.tempos.length > 0) {
    return midi.header.tempos[0].bpm/60;
  } else {
    return 120/60;
  }
}

/**
 * This class extends the functionality of the Piano class from `@tonejs/piano`.
 * It automatically do the key-up events for played notes based on their duration.
 */
class AutoKeyupPiano {
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
  playNote(note: Note) {
    this.piano.keyDown({midi: note.pitch, velocity: note.velocity});
    this.pendingOffsets.set(note.pitch, note.onset + note.duration);
  }

  /**
   * Stops a note immediately.
   * @param {Note} note - The note to be stopped.
   */
  stopNote(note: Note) {
    this.piano.keyUp({midi: note.pitch});
    this.pendingOffsets.delete(note.pitch);
  }

  /**
   * Updates the piano state, releasing keys that have reached their offset time.
   * @param {number} time - The current time.
   */
  update(time: number) {
    for (const [pitch, offset] of this.pendingOffsets.entries()) {
      if (time > offset) {
        this.piano.keyUp({midi: pitch});
        this.pendingOffsets.delete(pitch);
      }
    }
  }

  /**
   * Stops all currently playing notes.
   */
  stop() {
    for (const [pitch, offset] of this.pendingOffsets.entries()) {
      this.piano.keyUp({midi: pitch});
      this.pendingOffsets.delete(pitch);
    }
  }
}

/**
 * A simpler subset of Midi data.
 * Only contains onsets of notes and their duration, pitch, and velocity.
 */
class Pianoroll{
  onsets: Note[];
  constructor(midi: Midi){
    const ticksPerSecond = midi.header.secondsToTicks(1);
    const bps = getBps(midi);
    this.onsets = midi.tracks[0].notes.map((note) => new Note(
      note.ticks / ticksPerSecond * bps,
      note.durationTicks / ticksPerSecond * bps,
      note.midi,
      note.velocity
    ));
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
    this.onsets = this.onsets.filter((n) => n !== note);
  }
}

export default {
  name: 'PianorollEditor',
  props: {
    midiFile: {
      type: File,
      required: true
    }
  },
  emits: ['save'],
  setup(props: { midiFile: File}, { emit }) {
    const pianorollCanvas = ref<HTMLCanvasElement | null>(null);
    const piano = new AutoKeyupPiano(new Piano({
    velocities: 5,
    volume: {
    	pedal: -12,
    	strings: -12,
    	keybed: -12,
    	harmonics: -12,
    }
    }));
    let ctx: CanvasRenderingContext2D | null = null;
    let midiData: Midi | null = null;
    let scaleX = 50 ;
    let shiftX = 1;
    let gap = 0.6;
    let pianoroll: Pianoroll | null = null;
    let cursorPosition = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let draggingObject: string | Note | null = null;


    const drawPianoroll = (): void => {
      if (!midiData || !ctx || !pianorollCanvas.value) return;
      let height = pianorollCanvas.value.clientHeight;
      let width = pianorollCanvas.value.clientWidth; 
      pianorollCanvas.value.height = height;
      pianorollCanvas.value.width = width;
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      // Draw bar lines
      ctx.strokeStyle = '#333333';
      let barDuration: number;
      barDuration = scaleX*4;
      
      for (let i = (shiftX*scaleX)%(barDuration); i < width; i += barDuration) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      // Draw MIDI notes
      let noteCount = 0;
      for (const note of pianoroll!.getNotesBetween(0, 100)) {
        
        const hue = (note.pitch % 12) * 30; // 30 degrees per semitone
        const lightness = 40 + Math.abs(hue-180)*0.1;
        ctx.beginPath();
        ctx.roundRect(((note.onset)+shiftX)*scaleX+gap, pitchToCanvas(note.pitch), (note.duration)*scaleX-2*gap, height/127, 1);
        ctx.fillStyle = `hsl(${hue}, 90%, ${lightness}%)`;
        ctx.fill();
        noteCount++;
      }

      // Draw cursor
      const cursorWidth = 10;
      ctx.strokeStyle = '#55FF00';
      for (let i = 0; i < cursorWidth; i++) {
        ctx.beginPath();
        ctx.globalAlpha = Math.exp(-i / (cursorWidth / 3));
        ctx.moveTo(getCursorCanvasPosition()-i, 0);
        ctx.lineTo(getCursorCanvasPosition()-i, height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      //display key of dragging note
      if (draggingObject instanceof Note) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        const noteName = getNoteNameFromPitch(draggingObject.pitch);

        ctx.fillText(noteName, beatToCanvas(draggingObject.onset), pitchToCanvas(draggingObject.pitch)-30);
      }
    };

    const getNoteNameFromPitch = (pitch: number): string => {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return noteNames[pitch % 12] + (Math.floor(pitch/12)-1)
    }

    const getCursorCanvasPosition = (): number => {
      let pixel = beatToCanvas(cursorPosition);
      return Math.min(Math.max(pixel, 5), pianorollCanvas.value!.clientWidth);
    }
 
    const beatToCanvas = (beat: number): number => {
      return beat*scaleX + shiftX*scaleX;
    }

    const canvasToBeat = (canvasX: number): number => {
      return (canvasX - shiftX*scaleX)/scaleX;
    }

    const screenToBeat = (screenX: number): number => {
      return canvasToBeat(screenX - pianorollCanvas.value!.getBoundingClientRect().left);
    }

    const screenToCanvas = (screenX: number): number => {
      return screenX - pianorollCanvas.value!.getBoundingClientRect().left;
    }

    const canvasToScreen = (canvasX: number): number => {
      return canvasX + pianorollCanvas.value!.getBoundingClientRect().left;
    }

    const pitchToCanvas = (pitch: number): number => {
      return (127-pitch)/127*pianorollCanvas.value!.clientHeight;
    }

    const screenToPitch = (screenY: number): number => {
      return Math.ceil(127 - (screenY - pianorollCanvas.value!.getBoundingClientRect().top)/pianorollCanvas.value!.clientHeight*127);
    }

    const handleWheel = (event: WheelEvent): void => {
      if(event.ctrlKey) {
        let oldPianorollXUnderMouse = (event.clientX - pianorollCanvas.value!.getBoundingClientRect().left)/scaleX - shiftX;
        scaleX *= Math.exp(event.deltaY/-700);
        shiftX = (event.clientX - pianorollCanvas.value!.getBoundingClientRect().left)/scaleX - oldPianorollXUnderMouse;
        event.preventDefault();
      } else {
        shiftX -= 0.5*event.deltaY/scaleX;
      }
      drawPianoroll();
    };

    const handleDoubleClick = (event: MouseEvent): void => {
      cursorPosition = screenToBeat(event.clientX);
      piano.stop();
      drawPianoroll();
      event.preventDefault();
      event.stopPropagation();
    };

    const handleMouseDown = (event: MouseEvent): void => {
      // test if mouse on cursor
      const cursorX = getCursorCanvasPosition();
      const pointerX = screenToCanvas(event.clientX);
      if (Math.abs(cursorX - pointerX) < 10) {
        draggingObject = 'cursor';
      } else if (pianoroll!.getNoteAt(screenToBeat(event.clientX), screenToPitch(event.clientY))) {
        draggingObject = pianoroll!.getNoteAt(screenToBeat(event.clientX), screenToPitch(event.clientY));
      }
      else {
        const newNote = new Note(
          screenToBeat(event.clientX),
          1,
          screenToPitch(event.clientY),
          0.6
      )
        pianoroll!.addNote(newNote);
        draggingObject = newNote;
        drawPianoroll();
      }
    };

    const handleMouseMove = (event: MouseEvent): void => {
      if (draggingObject === 'cursor') {
        cursorPosition = screenToBeat(event.clientX);
      }
      if (draggingObject instanceof Note) {
        pianoroll!.removeNote(draggingObject);
        draggingObject.onset = screenToBeat(event.clientX);
        draggingObject.pitch = screenToPitch(event.clientY);
        pianoroll!.addNote(draggingObject);
      }
      drawPianoroll();
    };

    const handleMouseUp = (): void => {
      draggingObject = null;
    };

    const addNote = (event: MouseEvent): void => {
      // Implementation of adding a note
      // Update midiData with the new note
      // ...
      drawPianoroll();
    };

    const playMidi = (): void => {
      const beatPerFrame = 0.125;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      intervalId = setInterval(() => {
        const oldCursorPosition = cursorPosition;
        cursorPosition += 0.125; // granularity of 1/8 beat
        piano.update(cursorPosition);
        const notesToPlay = pianoroll!.getNotesOnsetBetween(oldCursorPosition, cursorPosition);
        notesToPlay.forEach((note) => {
          piano.playNote(note);
        });
        drawPianoroll();
      }, 1000 * beatPerFrame / getBps(midiData!));
    };

    const stopMidi = (): void => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      piano.stop();
    };

    const saveMidi = (): void => {
      if (!midiData) return;
      const outputBuffer = midiData.toArray();
      const blob = new Blob([outputBuffer], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_midi.mid';
      a.click();
      URL.revokeObjectURL(url);
      emit('save');
    };

    const loadMidiFile = async (file: File): Promise<void> => {
      const arrayBuffer = await file.arrayBuffer();
      midiData = new Midi(arrayBuffer);
      pianoroll = new Pianoroll(midiData);
      drawPianoroll();
    };

    watch(() => props.midiFile, (newFile: File) => {
      if (newFile) {
        loadMidiFile(newFile);
      }
    });

    onMounted(() => {
      if (pianorollCanvas.value) {
        ctx = pianorollCanvas.value.getContext('2d');
        if (props.midiFile) {
          loadMidiFile(props.midiFile);
        }
      }
    });

    return {
      pianorollCanvas,
      handleWheel,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleDoubleClick,
      playMidi,
      stopMidi,
      saveMidi
    };
  }
}
</script>

<style scoped>

.pianoroll-canvas {
  border: 1px solid black;
  border-radius: 10px;
  background-color: #0e0e0e;
  width: 1200px;
  height: 600px;
}

.controls {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
</style>