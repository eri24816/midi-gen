<template>
    <div class="suggestion-card">
        <PianorollEditor :midiData="midiData" :editable="false" ref="pianorollEditor" />
        <MyButton @click="handleRemove" class="button remove-button">✘</MyButton>
        <MyButton @click="handleAccept" class="button accept-button">✔</MyButton>
    </div>
</template>

<script lang="ts">
import PianorollEditor from '@/components/PianorollEditor.vue';
import MyButton from '@/components/MyButton.vue';

import { ref, useTemplateRef } from 'vue';


export default {
    name: 'SuggestionCard',
    props: {
        midiData: {
            type: Uint8Array,
            required: true
        },
        cardId: {
            type: Number,
            required: true
        }
    },
    components: {
        PianorollEditor,
        MyButton
    },
    methods: {
        handleRemove() {
            this.$emit('remove', this.cardId);
        },
        handleAccept() {
            this.$emit('accept', this.cardId);
        }
    },
    setup() {
        const pianorollEditor = useTemplateRef<InstanceType<typeof PianorollEditor>>('pianorollEditor');
        return {
            pianorollEditor
        }
    }
}
</script>

<style scoped>
.suggestion-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    border-radius: 8px;
    padding: 4px;
    background-color: #151515;
}


.pianoroll-editor {
    flex: 1;
}

.button-container {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    gap: 4px;
}


.accept-button {
    height: 20px;
    padding: 0;
}

.remove-button {
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
    padding: 0;
    background-color: #7e5050;
}


</style>