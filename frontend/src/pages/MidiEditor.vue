<template>
  <div class="midi-editor">
    <h1>MIDI Editor</h1>
    <input type="file" accept=".mid,.midi" @change="handleFileInput" />
    <PianorollEditor @save="handleSave" ref="pianorollEditor" />
    <MyButton @clicked="handleGenerate">Generate Bar</MyButton>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue';
import PianorollEditor from '@/components/PianorollEditor.vue';
import MyButton from '@/components/MyButton.vue';
import axios from 'axios';
import { base64Decode, base64Encode } from '@/utils';
import { Pianoroll } from '@/utils';
import { Midi } from '@tonejs/midi';

export default defineComponent({
  name: 'MidiEditor',
  components: {
    PianorollEditor,
    MyButton
  },
  setup() {
    const pianorollEditor = ref<InstanceType<typeof PianorollEditor> | null>(null);

    const handleFileInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && (file.type === 'audio/midi' || file.type === 'audio/mid')) {
        pianorollEditor.value!.loadMidiFile(file);
      } else {
        alert('Please select a valid MIDI file.');
      }
    };

    const handleSave = () => {
      console.log('MIDI file saved');
    };

    const handleGenerate = () => {
      axios.post('/api/generate', {
        midi: base64Encode(pianorollEditor.value!.pianoroll.toMidi().toArray()),
        metadata: {
          title: 'Generated MIDI',
          artist: 'AI',
          album: 'Generated'
        }
      }).then((response) => {
        pianorollEditor.value!.pianoroll = new Pianoroll(base64Decode(response.data.midi));
        pianorollEditor.value!.render();
      });
    };

    return {
      pianorollEditor,
      handleFileInput,
      handleSave,
      handleGenerate
    };
  }
});
</script>
