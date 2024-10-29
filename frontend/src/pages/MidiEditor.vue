<template>
    <div class="midi-editor">
        <input
            type="file"
            accept=".mid,.midi"
            @change="handleFileInput"
            ref="fileInput"
        />
        <div class="panels">
            <div class="left-panel">
                <MainEditor
                    class="main-editor"
                    ref="mainEditor"
                />
                <ToolBox />
            </div>
            <SuggestionPanel class="right-panel" ref="suggestionPanel" />
        </div>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import PianorollEditor from "@/components/PianorollEditor.vue";
import MyButton from "@/components/MyButton.vue";
import ToolBox from "@/components/ToolBox.vue";
import SuggestionPanel from "@/components/SuggestionPanel.vue";
import { Midi } from "@tonejs/midi/src/Midi";
import { useStore } from "@/stores/counter";
import { Pianoroll } from "@/utils";
import MainEditor from "@/components/MainEditor.vue";

export default defineComponent({
    name: "MidiEditor",
    components: {
        PianorollEditor,
        MyButton,
        SuggestionPanel,
        ToolBox,
        MainEditor,
    },
    setup() {
        const store = useStore();
        const mainEditor = ref<InstanceType<typeof MainEditor> | null>(null);
        const suggestionPanel = ref<InstanceType<
            typeof SuggestionPanel
        > | null>(null);
        const fileInput = ref<HTMLInputElement | null>(null);
        const handleFileInput = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (
                file &&
                (file.type === "audio/midi" || file.type === "audio/mid")
            ) {
                store.mainEditor!.loadMidiFile(file);
                fileInput.value!.value = "";
            } else {
                alert("Please select a valid MIDI file.");
            }
        };


        return {
            mainEditor,
            handleFileInput,
            suggestionPanel,
            fileInput,
        };
    },
    mounted() {
        const store = useStore();
        store.mainEditor = this.mainEditor;
        store.mainPianoroll = this.mainEditor!.pianoroll! 
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

.main-editor {
    width: 100%;
    flex-grow: 1;
}

.toolbox {
    flex-basis: 150px;
}

input {
    flex-shrink: 0;
}
</style>
