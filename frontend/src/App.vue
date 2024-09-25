<template>
  <div class="app-container">
    <h1>MIDI Next Bar Generator</h1>
    <MidiDropzone @file-dropped="handleFileDrop" />
    <GenerateButton :midi-file="midiFile" @generate="handleGenerate" />
    <div v-if="generatedMidi" class="result">
      <h2>Generated MIDI:</h2>
      <pre>{{ generatedMidi }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MidiDropzone from './components/MidiDropzone.vue';
import GenerateButton from './components/GenerateButton.vue';
import axios from 'axios';

const midiFile = ref<File | null>(null);
const generatedMidi = ref<string | null>(null);
const isLoading = ref(false);

const handleFileDrop = (file: File) => {
  midiFile.value = file;
  generatedMidi.value = null;
};

const handleGenerate = async () => {
  if (!midiFile.value) {
    console.error('No MIDI file selected');
    return;
  }

  isLoading.value = true;
  generatedMidi.value = null;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (!base64) {
        throw new Error('Failed to read file');
      }

      const response = await axios.post('http://localhost:8000/generate-midi', {
        midi_file: base64,
        metadata: {} // Add any metadata if needed
      });

      // Decode the base64-encoded MIDI data
      const decodedMidi = atob(response.data.midiData);
      generatedMidi.value = decodedMidi;
    };
    reader.readAsDataURL(midiFile.value);
  } catch (error) {
    console.error('Error generating MIDI:', error);
    generatedMidi.value = 'Error generating MIDI';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.app-container {
  max-width: 800px; /* Adjust this value as needed */
  margin: 0 auto;
  padding: 0 20px; /* Optional: adds some space on the sides */
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.generate-button {
  margin: 10px 0;
}
</style>