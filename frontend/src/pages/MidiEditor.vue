<template>
  <div class="midi-editor">
    <input type="file" accept=".mid,.midi" @change="handleFileInput" />
    <div class="panels">
      <div class="left-panel">
        <PianorollEditor class="pianoroll-editor" @save="handleSave" ref="pianorollEditor" />
      </div>
      <SuggestionPanel class="right-panel"/>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue';
import PianorollEditor from '@/components/PianorollEditor.vue';
import MyButton from '@/components/MyButton.vue';
import SuggestionPanel from '@/components/SuggestionPanel.vue';
import { Midi } from '@tonejs/midi';
import { useStore } from '@/stores/counter';
import { Pianoroll } from '@/utils';

export default defineComponent({
  name: 'MidiEditor',
  components: {
    PianorollEditor,
    MyButton,
    SuggestionPanel
  },
  setup() {
    const store = useStore();
    const pianorollEditor = ref<InstanceType<typeof PianorollEditor> | null>(null);

    const handleFileInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && (file.type === 'audio/midi' || file.type === 'audio/mid')) {
        file.arrayBuffer().then((buffer) => {
          store.mainPianoroll = new Pianoroll(buffer);
        });
      } else {
        alert('Please select a valid MIDI file.');
      }
    };

    const handleSave = () => {
      console.log('MIDI file saved');
    };

    return {
      pianorollEditor,
      handleFileInput,
      handleSave
    };
  },
  mounted() {
    const store = useStore();
    this.pianorollEditor!.pianoroll = store.mainPianoroll;
    store.$subscribe((mutation, state) => {
      this.pianorollEditor!.pianoroll = store.mainPianoroll;
    });
  },
});
</script>

<style scoped>
.midi-editor {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  height: 100vh;
  max-height: 100vh;
}

.panels {
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-grow: 1;
  margin-bottom: 20px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 65%;
  align-items: center;
  padding: 20px 0 20px 0;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 25%;
}

.pianoroll-editor {
  width: 90%;
  flex-grow: 1;
}
</style>
