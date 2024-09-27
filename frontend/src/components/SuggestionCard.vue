<template>
    <div class="suggestion-card">
        <PianorollEditor :midiData="midiData" />
    </div>
</template>

<script lang="ts">
import PianorollEditor from '@/components/PianorollEditor.vue';

export default {
    name: 'SuggestionCard',
    props: {
        midiData: {
            type: ArrayBuffer,
            required: true
        }
    },
    components: {
        PianorollEditor
    },
}
</script>

<style scoped>
.suggestion-card {
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    border: 1px solid #4CAF50;
    border-radius: 8px;
    padding: 4px;
}

.pianoroll-editor {
    flex: 1;
}
</style>