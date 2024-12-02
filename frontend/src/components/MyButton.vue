<template>
    <button @click="click">
        <slot></slot>
    </button>
</template>

<script setup lang="ts">
const emit = defineEmits(["click"]);

const click = () => {
    emit("click");
};
</script>

<style scoped>
button {
    font-size: 16px;
    cursor: pointer;
    background-color: #307d33;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    margin-top: 10px;
    margin-bottom: 10px;
}

button:hover {
    background-color: #3e8e41;
}

button:active {
    background-color: #3e8e41;
    scale: 0.95;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
