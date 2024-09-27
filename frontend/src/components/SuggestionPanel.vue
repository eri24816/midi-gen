<template>
    <div class="suggestion-panel">
        <h2>Suggestions</h2>
        <div class="scroll-container">
            <div class="scroll-content">
                <SuggestionCard v-for="[cardId, midiData] in midiDataList" :key="cardId" :midiData="midiData" :cardId="cardId" @remove="handleRemove" />
            </div>
        </div>

        <MyButton @click="handleGenerate">Generate Bar</MyButton>
    </div>
</template>

<script lang="ts">
import SuggestionCard from '@/components/SuggestionCard.vue';
import axios from 'axios';
import { base64Decode, base64Encode } from '@/utils';
import { useStore } from '@/stores/counter';
import { defineComponent } from 'vue';
import MyButton from '@/components/MyButton.vue';
export default defineComponent({
    name: 'SuggestionPanel',
    components: {
        SuggestionCard,
        MyButton
    },
    setup() {
        const storeInstance = useStore();
        return {
            storeInstance
        }
    },
    data() {
        return {
            midiDataList: new Map<number, Uint8Array>()
        }
    },
    methods: {
        handleGenerate() {
            axios.post('/api/generate', {
                midi: base64Encode(this.storeInstance.mainPianoroll.toMidi().toArray()),
                metadata: {
                    title: 'Generated MIDI',
                    artist: 'AdI',
                    album: 'Generated' 
                }
            }).then((response) => {
                //this.storeInstance.mainPianoroll = new Pianoroll(base64Decode(response.data.midi));
                this.midiDataList.set(Math.random(), base64Decode(response.data.midi));
            });
        },
        handleRemove(cardId: number) {
            this.midiDataList.delete(cardId);
        }
    }
});
</script>

<style scoped>
.suggestion-panel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    background-color: #151515;
    margin-bottom: 20px;
    border-radius: 8px;
    border: 1px inset #111111;
    padding: 10px;
}

.scroll-container {
    overflow: auto;
}

.scroll-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
}

.suggestion-card {
    height: 200px;
    margin: 0 40px;
}
</style>