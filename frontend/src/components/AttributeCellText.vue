<template>
    <div class="attribute-cell">
        <input type="text" v-model="value" />
    </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue';
// expose value to parent component
defineExpose({
    value: ref(''),
});

</script>

<style scoped>
    .attribute-cell {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    input {
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        text-align: center;
        border: none;
        background-color: #0e0e0e;
    }
</style>
