<template>
    <div class="attribute-cell">
        <input type="number" v-model="value" class="input" ref = "input" @wheel="onWheel"/>
    </div>
</template>

<script setup lang="ts">

import { onMounted, ref, watch } from 'vue';

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

const value = ref(0);
const input = ref<HTMLInputElement | null>(null);

const onWheel = (event: WheelEvent) => {
    value.value += (event.deltaY > 0 ? -1 : 1) 
}

const valueUpdated = (newValue:number) => {
// limit the value to the range [min, max] when it changes
    if (newValue < min) {
        value.value = min;
    } else if (newValue > max) {
        value.value = max;
    }
    value.value = Math.round(value.value);
    input.value!.style.background = `linear-gradient(to top, #0e0e0e ${100*(value.value-min)/(max-min)}%, #1e1e1e ${100*(value.value-min)/(max-min)}%)`;
}

watch(value, valueUpdated);

onMounted(() => {
    valueUpdated(value.value);
});

</script>

<style scoped>
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
</style>
