<template>
  <div class="pianoroll-editor">
    <canvas class="pianoroll-canvas" ref="pianorollCanvas" @mousedown.prevent="handleMouseDown" @wheel="handleWheel" @contextmenu.prevent></canvas>
    <div class="controls">
      <button @click="playMidi">Play</button>
      <button @click="stopMidi">Stop</button>
      <button @click="saveMidi">Save</button>
      <button @click="clear">Clear</button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import { Midi } from '@tonejs/midi';
import { Piano } from '@tonejs/piano'
import { Note, Pianoroll } from '@/utils';


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
    if(this.pendingOffsets.has(note.pitch)) {
      this.piano.keyUp({midi: note.pitch});
    }
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

interface DragBehavior {
  mouseMove(event: MouseEvent): void;
  mouseUp(event: MouseEvent): void;
}

export default {
  name: 'PianorollEditor',
  emits: ['save'],
  props: {
    midiData: {
      type: ArrayBuffer,
      default: null
    }
  },
  setup(props:{midiData: ArrayBuffer|null}, { emit }) {
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
    let scaleX = 50 ;
    let shiftX = 1;
    let gap = 0.6;
    let pianoroll = ref<Pianoroll>(new Pianoroll(props.midiData));
    let cursorPosition = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let dragBehavior: DragBehavior | null = null;

    class MoveNoteDragBehavior implements DragBehavior {
      private _note: Note;
      public get note(): Note {
        return this._note;
      }
      constructor(event: MouseEvent){
        const noteUnderPointer = pianoroll.value.getNoteAt(screenToBeat(event.clientX), screenToPitch(event.clientY));
        this._note = noteUnderPointer ? noteUnderPointer : createNote(screenToBeat(event.clientX), screenToPitch(event.clientY));
        pianoroll.value.addNote(this._note);
        piano.playNote(this._note);
        render();
      }
      public mouseMove(event: MouseEvent): void {
        
        pianoroll.value.removeNote(this._note);
        const newNote = createNote(screenToBeat(event.clientX), screenToPitch(event.clientY),this._note.velocity);
        pianoroll.value.addNote(newNote);

        if (newNote.pitch !== this._note.pitch) {
        piano.stopNote(this._note);
          piano.playNote(newNote);
        }
        this._note = newNote;
        render();
      }
      public mouseUp(event: MouseEvent): void {
        piano.stopNote(this._note);   
      }
    }

    class RemoveNoteDragBehavior implements DragBehavior {
      constructor(event: MouseEvent){
        const noteUnderPointer = pianoroll.value.getNoteAt(screenToBeat(event.clientX), screenToPitch(event.clientY));
        if (noteUnderPointer) {
          pianoroll.value.removeNote(noteUnderPointer);
          render();
        }
      }
      public mouseMove(event: MouseEvent): void {
        const noteUnderPointer = pianoroll.value.getNoteAt(screenToBeat(event.clientX), screenToPitch(event.clientY));
        if (noteUnderPointer) {
          pianoroll.value.removeNote(noteUnderPointer);
          render();
        }
      }
      public mouseUp(event: MouseEvent): void {
        
      }
    }

    class CursorDragBehavior implements DragBehavior {
      public mouseMove(event: MouseEvent): void {
        cursorPosition = Math.max(-2, screenToBeat(event.clientX));
        render();
      }
      public mouseUp(event: MouseEvent): void {
        
      }
    }
    

    const render = (): void => {
      if (!pianoroll || !ctx || !pianorollCanvas.value) return;
      let height = pianorollCanvas.value.clientHeight;
      let width = pianorollCanvas.value.clientWidth; 
      pianorollCanvas.value.height = height;
      pianorollCanvas.value.width = width;
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw bar lines
      ctx.strokeStyle = '#333333';
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      let barGap: number;
      barGap = scaleX*4;
      
      // for (let i = (shiftX*scaleX)%(barDuration); i < width; i += barDuration) {
      //   ctx.beginPath();
      //   ctx.moveTo(i, 0);
      //   ctx.lineTo(i, height);
      //   ctx.stroke();
      //   if(i%(barDuration/4) == 0) {
      //     // text
      //     ctx.fillStyle = '#FFFFFF';
      //     ctx.font = '12px Arial';
      //     ctx.textAlign = 'center';
      //     ctx.fillText(((i/scaleX-1)/4)+1+'', i+10, height-12);
      //   }
      // }

      let startDrawnBar = Math.floor(canvasToBeat(0)*2)/2;
      let endDrawnBar = Math.floor(canvasToBeat(width)*2)/2;
      let hop = 0.5;
      let hops = [[480,16],[300,8],[140,4],[80,2],[40,1]];
      for (const [bar, hop_] of hops) {
        if (endDrawnBar - startDrawnBar > bar) {
          hop = hop_;
          startDrawnBar = Math.floor(startDrawnBar/hop)*hop;
          endDrawnBar = Math.floor(endDrawnBar/hop)*hop;
          break;
        }
      }
      startDrawnBar = Math.max(startDrawnBar, 0);
      for (let i = startDrawnBar; i <= endDrawnBar; i+=hop) {
        if (i%4 == 0) {
          ctx.strokeStyle = '#555555';
        } else if (i%1 == 0) {
          ctx.strokeStyle = '#333333';
        } else {
          ctx.strokeStyle = '#222222';
        }
        ctx.beginPath();
        ctx.moveTo(beatToCanvas(i), 0);
        ctx.lineTo(beatToCanvas(i), height);
        ctx.stroke();
        if (i%4 == 0) {
          ctx.fillText((i/4+1).toString(), beatToCanvas(i)+10, height-12);
        }
      }

      // Draw MIDI notes
      let noteCount = 0;
      const timeLowerBound = Math.max(0, -shiftX);
      const timeUpperBound =  width/scaleX-shiftX;
      for (const note of pianoroll.value.getNotesBetween(timeLowerBound, timeUpperBound)) {
        
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
      if (dragBehavior instanceof MoveNoteDragBehavior) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        const noteName = getNoteNameFromPitch(dragBehavior.note.pitch);

        ctx.fillText(noteName, beatToCanvas(dragBehavior.note.onset), pitchToCanvas(dragBehavior.note.pitch)-30);
      }
    };

    const createNote = (onset: number, pitch: number, velocity: number = 0.6, snap=0.125): Note => {
      onset = Math.round(onset/snap)*snap;
      if (onset < 0) {
        onset = 0;
      }
      const notesInBar = pianoroll.value.getNotesOnsetBetween(onset, onset - onset%4 + 4);
      let duration = - onset%4 + 4;
      for (const note of notesInBar) {
        if (note.pitch === pitch) {
          duration = Math.min(duration, note.onset - onset);
        }
      }
      duration = Math.max(Math.round(duration/snap)*snap, snap);
      return new Note(onset, duration, pitch, velocity);
    }

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
        shiftX = Math.min(shiftX, 2);
        event.preventDefault();
      } else {
        shiftX -= 0.5*event.deltaY/scaleX;
        shiftX = Math.min(shiftX, 2);
      }
      render();
    };

    const handleMouseDown = (event: MouseEvent): void => {
      // test if mouse on cursor
      const cursorX = getCursorCanvasPosition();
      const pointerX = screenToCanvas(event.clientX);
      if(event.buttons === 1) {
        if (Math.abs(cursorX - pointerX) < 10) {
          dragBehavior = new CursorDragBehavior();
        } 
        else {
          dragBehavior = new MoveNoteDragBehavior(event);
        }
      } else if (event.buttons === 2) {
        dragBehavior = new RemoveNoteDragBehavior(event);
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (event: MouseEvent): void => { 
      dragBehavior?.mouseMove(event);
    };

    const handleMouseUp = (event: MouseEvent): void => {
      dragBehavior?.mouseUp(event);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const addNote = (event: MouseEvent): void => {
      // Implementation of adding a note
      // Update midiData with the new note
      // ...
      render();
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
        const notesToPlay = pianoroll.value.getNotesOnsetBetween(oldCursorPosition, cursorPosition);
        notesToPlay.forEach((note) => {
          piano.playNote(note);
        });
        render();
      }, 1000 * beatPerFrame / pianoroll.value.bps);
    };

    const stopMidi = (): void => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      piano.stop();
    };

    const saveMidi = (): void => {
      const outputBuffer = pianoroll.value.toMidi().toArray();
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
      pianoroll.value = new Pianoroll(arrayBuffer);
      render();
    };

    const clear = (): void => {
      pianoroll.value = new Pianoroll();
      render();
    };


    onMounted(() => {
      if (pianorollCanvas.value) {
        ctx = pianorollCanvas.value.getContext('2d');
      }
      render();
    });

    return {
      pianorollCanvas,
      handleWheel,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      playMidi,
      stopMidi,
      saveMidi,
      pianoroll,
      render,
      loadMidiFile,
      clear
    };
  },
  watch: {
    pianoroll(newVal) {
      console.log(newVal);
      this.render();
    }
  }
}
</script>

<style scoped>
.pianoroll-editor {
  position: relative;
}

.pianoroll-canvas {
  position: absolute;
  border: 1px solid black;
  border-radius: 10px;
  background-color: #0e0e0e;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  bottom:  5px;
  right: 5px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 5px;
}
</style>