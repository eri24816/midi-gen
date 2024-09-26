<template>
  <button @click="clicked">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">

const emit = defineEmits(['clicked']);

const clicked = () => {
  emit('clicked');
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