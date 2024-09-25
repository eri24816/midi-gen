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

type Note = {
  onset: number;
  duration: number;
  pitch: number;
  velocity: number;
}

function getBps(midi: Midi): number {
  if (midi.header.tempos.length > 0) {
    return midi.header.tempos[0].bpm/60;
  } else {
    return 120/60;
  }
}

class AutoKeyupPiano{
  private pendingOffsets: Map<number, number> = new Map(); // pitch -> offset
  constructor(public piano: Piano){
    piano.load().then(() => {
      console.log("Piano loaded");
    });
    piano.toDestination();
  }

  playNote(note: Note){
    this.piano.keyDown({midi: note.pitch, velocity: note.velocity});
    this.pendingOffsets.set(note.pitch, note.onset + note.duration);
  }

  stopNote(note: Note){
    this.piano.keyUp({midi: note.pitch});
    this.pendingOffsets.delete(note.pitch);
  }

  update(time: number){
    for (const [pitch, offset] of this.pendingOffsets.entries()) {
      if (time > offset) {
        this.piano.keyUp({midi: pitch});
        this.pendingOffsets.delete(pitch);
      }
    }
  }

  stop(){
    for (const [pitch, offset] of this.pendingOffsets.entries()) {
      this.piano.keyUp({midi: pitch});
      this.pendingOffsets.delete(pitch);
    }
  }
}

class Pianoroll{
  onsets: Note[];
  constructor(midi: Midi){
    const ticksPerSecond = midi.header.secondsToTicks(1);
    const bps = getBps(midi);
    this.onsets = midi.tracks[0].notes.map((note) => ({
      onset: note.ticks / ticksPerSecond * bps,
      duration: note.durationTicks / ticksPerSecond * bps,
      pitch: note.midi,
      velocity: note.velocity
    }));
  }
  
  getNotesBetween(start: number, end: number): Note[] {
    return this.onsets.filter((note) => note.onset < end && note.onset + note.duration >= start);
  }

  getNotesOnsetBetween(start: number, end: number): Note[] {
    return this.onsets.filter((note) => note.onset < end && note.onset >= start);
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
    let isDrawing = false;
    let midiData: Midi | null = null;
    let scaleX = 50 ;
    let shiftX = 1;
    let gap = 0.6;
    let pianoroll: Pianoroll | null = null;
    let cursorPosition = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;



    const drawPianoroll = (): void => {
      if (!midiData || !ctx || !pianorollCanvas.value) return;
      let height = pianorollCanvas.value.clientHeight;
      let width = pianorollCanvas.value.clientWidth; 
      pianorollCanvas.value.height = height;
      pianorollCanvas.value.width = width;
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      // Draw bar lines
      ctx.strokeStyle = 'grey';
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
        ctx.roundRect(((note.onset)+shiftX)*scaleX+gap, (127-note.pitch)/127*height, (note.duration)*scaleX-2*gap, height/127, 1);
        ctx.fillStyle = `hsl(${hue}, 90%, ${lightness}%)`;
        ctx.fill();
        noteCount++;
      }

      // Draw cursor
      ctx.strokeStyle = '#55FF00';
      ctx.beginPath();
      ctx.moveTo(beatToPixel(cursorPosition), 0);
      ctx.lineTo(beatToPixel(cursorPosition), height);
      ctx.stroke();
    };

    const beatToPixel = (beat: number): number => {
      return beat*scaleX + shiftX*scaleX;
    }

    const pixelToBeat = (beat: number): number => {
      return (beat - shiftX*scaleX)/scaleX;
    }

    const screenToBeat = (screenX: number): number => {
      return pixelToBeat(screenX - pianorollCanvas.value!.getBoundingClientRect().left);
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
      isDrawing = true;
      addNote(event);
    };

    const handleMouseMove = (event: MouseEvent): void => {
      if (isDrawing) {
        addNote(event);
      }
    };

    const handleMouseUp = (): void => {
      isDrawing = false;
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