

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
                            <!-- {{attrValues[j]?.[attribute.name]}} -->
                            <component
                                :is="attribute.component" :min=attribute.min :max=attribute.max v-model="attrValues[j][attribute.name]"
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

import { base64Encode, Cooldown, CooldownDict, type Note } from '@/utils';
import AttributeCellNumber from './AttributeCellNumber.vue';
import AttributeCellText from './AttributeCellText.vue';

import PianorollEditor from './PianorollEditor.vue';
import { ref, watch } from 'vue';
import axios from 'axios';

const MAX_N_BARS = 300;

const pianoroll = ref<InstanceType<typeof PianorollEditor> | null>(null);
const attributeGridScrollCont = ref<HTMLElement | null>(null);
const attributeGrid = ref<HTMLElement | null>(null);
const extractCooldown = new CooldownDict(0.5);

const loadMidiFile = (file: File) => {
    pianoroll.value?.loadMidiFile(file).then(() => {
        // extract attributes for each bar
        const newNBars = Math.ceil(pianoroll.value!.pianoroll.duration/4);
        nBars.value = newNBars
        for (let i = 0; i < nBars.value; i++) {
            extract(i);
        }
    });
    
};

const getDefaultAttributeValues = () => {
    const defaultValues: Record<string, Object> = {};
    for (const attribute of attributeTypes) {
        defaultValues[attribute.name] = attribute.type === 'text' ? '' : 0;
    }
    return defaultValues;
};

const attributeTypes = [
    {name: 'chord', component: AttributeCellText, type: 'text'},
    {name: 'velocity', component: AttributeCellNumber, type: 'number', min: 0, max: 127},
    {name: 'density', component: AttributeCellNumber, type: 'number', min: 0, max: 32},
    {name: 'polyphony', component: AttributeCellNumber, type: 'number', min: 0, max: 8},
];

const barWidth = ref(100);
const shiftX = ref(0);
const scaleX = ref(1);
const nBars = ref(0);
const attrValues = ref<Record<string, Object>[]>([]);

for (let i = 0; i < MAX_N_BARS; i++) {
    attrValues.value.push(getDefaultAttributeValues());
}

const extract = (barIdx:number)=>{
    const midiData = base64Encode(pianoroll.value!.pianoroll.slice(barIdx*4,(barIdx+1)*4,true).toMidi().toArray());
    axios.post('/api/extract', {
        midi: midiData,
    }).then((response) => {
        if(barIdx>=nBars.value){ // the pianoroll has been changed
            return;
        }
        const data = response.data;
        for (const attribute of attributeTypes) {
            const val = data[attribute.name]
            if (val!==undefined) {
                attrValues.value[barIdx][attribute.name] = val[0];
            }
        }
    });
};

const onTransform = (transform: { shiftX: number; scaleX: number }) => {
    barWidth.value = 4*transform.scaleX;
    shiftX.value = transform.shiftX;
    scaleX.value = transform.scaleX;
};

const onEdit = (addedNotes: Note[], removedNotes: Note[]) => {
    const oldNBars = nBars.value;
    nBars.value = Math.min(MAX_N_BARS,Math.ceil(pianoroll.value!.pianoroll.duration/4))
    for (let i = nBars.value; i < oldNBars; i++) {
        attrValues.value[i] = getDefaultAttributeValues();
    }
    
    
    for (let i = nBars.value; i < nBars.value; i++) {
        attrValues.value[i] = getDefaultAttributeValues();
    }
    
    let modifiedBars = new Set<number>();
    for (const note of addedNotes) {
        modifiedBars.add(Math.floor(note.onset/4));
    }
    for (const note of removedNotes) {
        modifiedBars.add(Math.floor(note.onset/4));
    }
    for (const barIdx of modifiedBars) {
        extractCooldown.request(barIdx+'', () => extract(barIdx));
    }
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