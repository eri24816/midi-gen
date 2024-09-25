<template>
  <div class="midi-editor">
    <h1>MIDI Editor</h1>
    <input type="file" accept=".mid,.midi" @change="handleFileInput" />
    <PianorollEditor v-if="midiFile" :midiFile="midiFile" @save="handleSave" />
  </div>
</template>

<script>
import { ref } from 'vue';
import PianorollEditor from '@/components/PianorollEditor.vue';

export default {
  name: 'MidiEditor',
  components: {
    PianorollEditor
  },
  setup() {
    const midiFile = ref(null);

    const handleFileInput = (event) => {
      const file = event.target.files[0];
      if (file && (file.type === 'audio/midi' || file.type === 'audio/mid')) {
        midiFile.value = file;
      } else {
        alert('Please select a valid MIDI file.');
      }
    };

    const handleSave = () => {
      console.log('MIDI file saved');
    };

    return {
      midiFile,
      handleFileInput,
      handleSave
    };
  }
}
</script>
