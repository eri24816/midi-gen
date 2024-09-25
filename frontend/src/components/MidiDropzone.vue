<template>
  <div
    class="dropzone"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <p v-if="!file">Drop your MIDI file here</p>
    <p v-else>File: {{ file.name }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const file = ref<File | null>(null);
const emit = defineEmits(['file-dropped']);

const onDrop = (e: DragEvent) => {
  const droppedFile = e.dataTransfer?.files[0];
  if (droppedFile/* && droppedFile.type === 'audio/midi' */) {
    file.value = droppedFile;
    emit('file-dropped', droppedFile);
  } else {
    alert('Please drop a valid MIDI file.');
  }
};
</script>

<style scoped>
.dropzone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}
</style>