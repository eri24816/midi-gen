<template>
  <div class="midi-editor">
    <input type="file" accept=".mid,.midi" @change="handleFileInput" ref="fileInput" />
    <div class="panels">
      <div class="left-panel">
        <PianorollEditor class="pianoroll-editor" @save="handleSave" ref="pianorollEditor" :minPitch="21" :maxPitch="108" />
        <ToolBox/>
      </div>
      <SuggestionPanel class="right-panel" ref="suggestionPanel"/>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue';
import PianorollEditor from '@/components/PianorollEditor.vue';
import MyButton from '@/components/MyButton.vue';
import ToolBox from '@/components/ToolBox.vue';
import SuggestionPanel from '@/components/SuggestionPanel.vue';
import { Midi } from '@tonejs/midi';
import { useStore } from '@/stores/counter';
import { Pianoroll } from '@/utils';

export default defineComponent({
  name: 'MidiEditor',
  components: {
    PianorollEditor,
    MyButton,
    SuggestionPanel,
    ToolBox
  },
  setup() {
    const store = useStore();
    const pianorollEditor = ref<InstanceType<typeof PianorollEditor> | null>(null);
    const suggestionPanel = ref<InstanceType<typeof SuggestionPanel> | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const handleFileInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && (file.type === 'audio/midi' || file.type === 'audio/mid')) {
          store.pianorollEditor!.loadMidiFile(file);
          fileInput.value!.value = '';
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
      handleSave,
      suggestionPanel,
      fileInput
    };
  },
  mounted() {
    const store = useStore();
    store.pianorollEditor = this.pianorollEditor;
    store.suggestionPanel = this.suggestionPanel;
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
  gap: 50px;
  flex-grow: 1;
  margin-bottom: 20px;
  justify-content: space-between;
  padding: 20px 50px;

}

.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-basis: 65%;
  align-items: center;
  flex-grow: 1;
}

.right-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-basis: 25%;
  flex-grow: 1;
}

.pianoroll-editor {
  width: 100%;
  flex-grow: 1;
}

.toolbox {
  flex-basis: 150px;
}
</style>