<template>
    <div class="file-input">
        <label for="fileInput">
            Import MIDI
        </label>
        <input
            type="file"
            accept=".mid,.midi"
            ref="fileInput"
            id="fileInput"
            @change="change"
        />
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['change']);

const change = (event: Event) => {
    emit('change', event)
};
</script>

<style scoped>

.file-input {
    
    margin-top: 10px;
    margin-bottom: 10px;
}

input[type="file"] {
    opacity: 0; 
    width: 1px;
    height: 1px;
}

label {
    padding: 5px 10px;
    background-color: #307D33;
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

label:hover {
    background-color: #3e8e41;
}
</style>