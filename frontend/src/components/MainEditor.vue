

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
                <div class="attribute-row">
                    <div :style="{marginLeft:shiftX * scaleX+ 'px'}" class="attribute-row-inner">
                        <div v-for="(n, j) in (nBars+8)" :key="j" class="attribute-cell":style="{
                            width:barWidth+'px'}">
                            <button class="generate-button" @click="generate(j, 4, true)">👾✏️</button> 
                        </div>
                    </div>
                    <div class="attribute-header">
                        generate
                    </div>
                </div>

                <div v-for="(attribute,i) in attributeTypes" :key="i" class="attribute-row">
                    <div :style="{marginLeft:shiftX * scaleX+ 'px'}" class="attribute-row-inner">
                        <div v-for="(n, j) in (nBars+8)" :key="j" class="attribute-cell":style="{
                            width:barWidth+'px'}">
                            <!-- {{attrValues[j]?.[attribute.name]}} -->
                            <component
                                :is="attribute.component" :min=attribute.min :max=attribute.max 
                                v-model:realValue="attrRealValues[j][attribute.name]"
                                v-model:userValue="attrUserValues[j][attribute.name]"
                                v-model:isDetermined="attrIsDetermined[j][attribute.name]"
                                :validator="attribute.validator"
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

import { base64Decode, base64Encode, Cooldown, CooldownDict, Pianoroll, type Note } from '@/utils';
import AttributeCellNumber from './AttributeCellNumber.vue';
import AttributeCellText from './AttributeCellText.vue';

import PianorollEditor from './PianorollEditor.vue';
import { ref, watch } from 'vue';
import axios from 'axios';
import { useStore } from '@/stores/counter';

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
    {name: 'chord', component: AttributeCellText, type: 'text', validator: (value: string) => /^([A-Ga-g][#b]?(M|m|o|\+|7|M7|m7|o7|\/o7|sus2|sus4)? ){0,3}[A-Ga-g][#b]?(M|m|o|\+|7|M7|m7|o7|\/o7|sus2|sus4)?$/.test(value)},
    {name: 'velocity', component: AttributeCellNumber, type: 'number', min: 0, max: 127},
    {name: 'density', component: AttributeCellNumber, type: 'number', min: 0, max: 32},
    {name: 'polyphony', component: AttributeCellNumber, type: 'number', min: 0, max: 8},
];

const store = useStore();

const barWidth = ref(100);
const shiftX = ref(0);
const scaleX = ref(1);
const nBars = ref(0);

let currentGenerationId = 0;

let curBar = 0

// collects all model values for each cell
const attrRealValues = ref<Record<string, any>[]>([]);
const attrUserValues = ref<Record<string, any>[]>([]);
const attrIsDetermined = ref<Record<string, boolean>[]>([]);

for (let i = 0; i < MAX_N_BARS; i++) {
    attrRealValues.value.push(getDefaultAttributeValues());
    attrUserValues.value.push(getDefaultAttributeValues());
    attrIsDetermined.value.push(Object.fromEntries(attributeTypes.map(attr => [attr.name, false])));
}

const generate = async (bar: number=-1, numSamples: number=4, resetSuggestions: boolean=false) => {
    if(bar !== -1){
        curBar = bar;
    }

    if(resetSuggestions){
        store.suggestionPanel!.reset();
    }

    const conditions: Record<string, any> = {};
    for (const attribute of attributeTypes) {
        if(attrIsDetermined.value[curBar][attribute.name]){
            conditions[attribute.name] = attrUserValues.value[curBar][attribute.name];
        }
    }

    console.log("👾Generate", curBar, conditions);

    currentGenerationId++;
    const localGenerationId = currentGenerationId;

    for(let i = 0; i < numSamples; i++) {
        if(localGenerationId !== currentGenerationId){
            return;
        }
        await axios.post('/api/generate', {
            midi: base64Encode(pianoroll.value!.pianoroll.slice(0,curBar*4).toMidi().toArray()),
            conditions
        }).then((response) => {
            if(localGenerationId === currentGenerationId){
                store.suggestionPanel!.addSuggestion(base64Decode(response.data.midi));
            }
        });
    }
}

store.generateCallback = generate;

const acceptSuggestion = (midiData: Uint8Array) => {
    pianoroll.value!.pianoroll.removeSlice(curBar*4, (curBar+1)*4);
    pianoroll.value!.pianoroll.overlapWith(new Pianoroll(midiData), curBar*4);
    pianoroll.value!.$emit('edit', pianoroll.value!.pianoroll.getNotesBetween(curBar*4, (curBar+1)*4),[]);
    pianoroll.value!.render();
}

store.acceptSuggestionCallback = acceptSuggestion;

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
                attrRealValues.value[barIdx][attribute.name] = val[0];
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
        attrRealValues.value[i] = getDefaultAttributeValues();
    }
    
    
    for (let i = nBars.value; i < nBars.value; i++) {
        attrRealValues.value[i] = getDefaultAttributeValues();
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
        height: 300px;
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
        left: 0px;
        width: 100px;
        padding-left: 10px;
        padding-right: 10px;
        text-align: right;
        top: auto;
        bottom:auto;
        line-height: 40px;
        background-color: #1e1e1e;
        border-right: 1px solid white;
        font-weight: bold;
    }
    .generate-button{
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        margin: 1px;
        border: outset 1px #1e1e1e;
        font-size: 16px;
    }
</style>