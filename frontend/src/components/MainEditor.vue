

<template>
    <div class="main-editor">
        <PianorollEditor ref="pianoroll" class="pianoroll"
        :minPitch=21
        :maxPitch=108
        @transform="onTransform"
        @edit="onEdit"
        />
        <!-- a 2d grid of celss -->
        <div class="attribute-grid-scroll-cont" ref="attributeGridScrollCont">
            <div class="attribute-grid" ref="attributeGrid">
                <div v-for="(attribute,i) in attributeTypes" :key="i" class="attribute-row">
                    <div :style="{marginLeft:shiftX * scaleX+ 'px'}" class="attribute-row-inner">
                        <div v-for="(n, j) in (nBars+8)" :key="j" class="attribute-cell":style="{
                            width:barWidth+'px'}">
                            <component
                                :is="attribute.component" :min=attribute.min :max=attribute.max
                            />
                        </div>
                    </div>
                    <div class="attribute-header">
                        {{attribute.name}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import type { Note } from '@/utils';
import AttributeCellNumber from './AttributeCellNumber.vue';
import AttributeCellText from './AttributeCellText.vue';

import PianorollEditor from './PianorollEditor.vue';
import { ref } from 'vue';

const pianoroll = ref<InstanceType<typeof PianorollEditor> | null>(null);
const attributeGridScrollCont = ref<HTMLElement | null>(null);
const attributeGrid = ref<HTMLElement | null>(null);

const loadMidiFile = (file: File) => {
    pianoroll.value?.loadMidiFile(file);
};

const attributeTypes = [
    {name: 'Chord', component: AttributeCellText, type: 'text'},
    {name: 'Velocity', component: AttributeCellNumber, type: 'number', min: 0, max: 127},
    {name: 'Density', component: AttributeCellNumber, type: 'number', min: 0, max: 32},
    {name: 'Polyphony', component: AttributeCellNumber, type: 'number', min: 0, max: 8},
];

let barWidth = ref(100);
let shiftX = ref(0);
let scaleX = ref(1);
let nBars = ref(0);

const onTransform = (transform: { shiftX: number; scaleX: number }) => {
    console.log(transform);
    barWidth.value = 4*transform.scaleX;
    shiftX.value = transform.shiftX;
    scaleX.value = transform.scaleX;
};

const onEdit = (addedNotes: Note[], removedNotes: Note[]) => {
    console.log(nBars);
    nBars.value = pianoroll.value!.pianoroll.duration/4;
};

defineExpose({
    loadMidiFile,
    pianoroll,
    barWidth,
});

</script>

<style scoped>
    .main-editor {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0px;
        width: 100%;
        height: 100%;
        gap: 10px;
    }
    .pianoroll {
        height: 100%;
        flex-grow: 1;
    }
    .attribute-grid-scroll-cont {
        height: 200px;
        bottom: 0;
        position: relative;
        overflow-x: hidden;
        overflow-y: hidden;
        width: auto;
    }
    .attribute-grid {
        height: 100%;
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .attribute-row {
        display: flex;
        position: relative;
        height: 40px;
    }
    .attribute-row-inner {
        display: flex;
    }
    .attribute-cell {
        overflow: hidden;
        border-left: 1px solid var(--color-border);
        height: 100%;
    }
    .attribute-cell:last-child {
        border-right: 1px solid var(--color-border);
    }
    .attribute-header {
        position: absolute;
        left: 10px;
        width: 70px;
        text-align: right;
        top: auto;
        bottom:auto;
        line-height: 40px;
    }
</style>