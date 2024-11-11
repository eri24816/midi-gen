<template>
    <div class="attribute-cell" ref="el">
        <input type="number" v-model="userValue" class="input" ref = "input" @wheel.prevent="onWheel"/>
        <div class="overlay"></div>
    </div>
</template>

<script setup lang="ts">

import { onMounted, ref, watch } from 'vue';
import { useAttributeCellLogic } from './AttributeCellLogic';


let {min, max} = defineProps({
    min: {
        type: Number,
        default: 0,
    },
    max: {
        type: Number,
        default: 127,
    },
});

const input = ref<HTMLInputElement | null>(null);
const el = ref<HTMLElement | null>(null);

const realValue = defineModel<number>('realValue', {default: 0});
const userValue = defineModel<number>('userValue', {default: 0});
const isDetermined = defineModel<boolean>('isDetermined', {default: false});
const {} = useAttributeCellLogic<number>(el, realValue, userValue, isDetermined);

const onWheel = (event: WheelEvent) => {
    userValue.value = Math.min(max, Math.max(min, userValue.value - event.deltaY/100));
}

const valueUpdated = (newValue:number) => {
    userValue.value = Math.round(userValue.value);
    input.value!.style.background = `linear-gradient(to top, #0e0e0e ${100*(userValue.value-min)/(max-min)}%, #1e1e1e ${100*(userValue.value-min)/(max-min)}%)`;
}

watch(userValue, valueUpdated);

onMounted(() => {
    valueUpdated(userValue.value);
});

defineExpose({
    isDetermined,
});

</script>

<style scoped>
    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #fff20000;
        pointer-events: none;
    }
    .attribute-cell.determined .overlay {
        background-color: #fff20027;
    }
    .attribute-cell {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
    }
    .input {
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        text-align: center;

        border: none;
        background-color: #0e0e0e;
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    /* Firefox */
    input[type=number] {
      -moz-appearance: textfield;
    }

    input:focus {
        outline: none;
    }
</style>
