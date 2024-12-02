<template>
    <div class="midi-editor">

        <div class="panels">
            <SideBar class="left-sidebar">
                <TabSwitch class="left-sidebar-switch" :tabs="[{title:'Intro', name:'intro'}, {title:'File', name:'file'}]">
                    <template #intro>
                        <h1>Music Generator</h1>
                        <IntroComp />
                    </template>
                    <template #file>
                        <FileTab @load="loadMidi" @save="saveMidi" @useTemplate="useTemplate" />
                    </template>
                </TabSwitch>


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

<script setup lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import PianorollEditor from "@/components/PianorollEditor.vue";
import MyButton from "@/components/MyButton.vue";
import ToolBox from "@/components/ToolBox.vue";
import SuggestionPanel from "@/components/SuggestionPanel.vue";
import { Midi } from "@tonejs/midi/src/Midi";
import { useStore } from "@/stores/counter";
import { Pianoroll } from "@/utils";
import MainEditor from "@/components/MainEditor.vue";
import SideBar from "@/components/SideBar.vue";
import IntroComp from "@/components/IntroTab.vue";
import TabSwitch from "@/components/TabSwitch.vue";
import FileTab from "@/components/FileTab.vue";
const store = useStore();
const mainEditor = ref<InstanceType<typeof MainEditor> | null>(null);
const suggestionPanel = ref<InstanceType<typeof SuggestionPanel> | null>(null);

const loadMidi = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (
        file &&
        (file.type === "audio/midi" || file.type === "audio/mid")
    ) {
        store.mainEditor!.loadMidiFile(file);
    } else {
        alert("Please select a valid MIDI file.");
    }
};

onMounted(() => {
    store.mainEditor = mainEditor.value;
    store.mainPianoroll = mainEditor.value!.pianoroll!;
    store.suggestionPanel = suggestionPanel.value;
});

const saveMidi = () => {
    store.mainPianoroll!.saveMidi();
};

const useTemplate = (template: any) => {
    store.mainEditor!.setAttributes(template.attributes);
};
</script>

<style scoped>
.midi-editor {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    height: calc(100vh - 30px);
    max-height: 100vh;
}

.panels {
    display: flex;
    flex-direction: row;
    gap: 30px;
    flex-grow: 1;
    justify-content: space-between;
    padding: 20px 20px;
    padding-bottom: 0;
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
    max-width: 20%;
}

.left-sidebar :is(h1, h2, h3) {
    color: rgb(255, 255, 255);
}

.left-sidebar h1 {
    font-size: 25px;
}



.left-sidebar-switch {
    height: calc(100% - 50px);
    width: 100%;
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
