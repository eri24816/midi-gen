<template>
    <div class="midi-editor">

        <div class="panels">
            <SideBar class="left-sidebar">
                <div class="left-sidebar-intro">
                    <h1>Music Generator</h1>
                    <p><b>Create your own music. Ask AI for help whenever you need.</b></p>
                    <p>
                        Left click to add notes. Right click to remove notes. Click [play] to play the music.
                    </p>
                    <p>
                        Under the editor is the attribute panel. Click [generate] to let AI generate music for the bar.
                        Set the attributes before clicking [generate] to control the AI's output.
                    </p>
                    <p>
                        When an attribute is yellow, it means it is controlled by the user. Right click on it to unset it.
                    </p>
                    <hr>
                    <h2>Import MIDI File </h2>
                    <p>
                    
                    <input
                        type="file"
                        accept=".mid,.midi"
                        @change="handleFileInput"
                        ref="fileInput"
                    />
                    </p>
                    <hr>
                    <h2>How does it work?</h2>
                    <p>
                        To generate the current bar, the AI takes the notes you (or the AI itself) have composed in the previous 15 bars as context. It also takes the attributes you have set as control.
                        If some attributes are not set, the AI will decide their values.
                    </p>
                </div>
                <button class="github-btn" onclick="window.open('https://github.com/eri24816/midi-gen', '_blank')">Learn more on GitHub</button>
            </SideBar>
            <div class="left-panel">
                <MainEditor
                    class="main-editor"
                    ref="mainEditor"
                />
                <!-- <ToolBox /> -->
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
import SideBar from "@/components/SideBar.vue";
export default defineComponent({
    name: "MidiEditor",
    components: {
        PianorollEditor,
        MyButton,
        SuggestionPanel,
        ToolBox,
        MainEditor,
        SideBar,
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
    padding: 20px 20px;
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

h1 {
    margin: 5px;
    text-align: left;
}

h2 {
    font-size: 20px;
    margin-top: 20px;
}

.left-sidebar {
    position: relative;
    color: rgb(216, 216, 216);
}

.left-sidebar :is(h1, h2, h3) {
    color: rgb(255, 255, 255);
}

.left-sidebar h1 {
    font-size: 25px;
}

a {
    color: rgb(35, 171, 255);
}

a:visited {
    color: rgb(47, 136, 225);
}

.left-sidebar-intro {
    padding: 10px;
    overflow-y: auto;
    height: calc(100% - 50px);
}

.github-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    position: absolute;
    bottom: 0;
    background-color: rgb(52, 74, 50);
}

.github-btn:hover {
    background-color: rgb(65, 90, 65);
}


</style>
