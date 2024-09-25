<template>
  <button @click="generate" :disabled="!midiFile">
    Generate Next Bar
  </button>
</template>

<script setup lang="ts">
defineProps<{
  midiFile: File | null;
}>();

const emit = defineEmits(['generate']);

const generate = () => {
  emit('generate');
};
</script>

<style scoped>
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>