<template>
    <div class="suggestion-panel">
        <h2>Suggestions</h2>
        <div class="scroll-container">
            <div class="scroll-content">
                <SuggestionCard v-for="[cardId, midiData] in midiDataList" :key="cardId" :midiData="midiData" 
                :cardId="cardId" @remove="handleRemove" @accept="handleAccept" :accepted="cardId == lastAccepted"/>
            </div>
        </div>

        <MyButton @click="handleGenerate">Generate More</MyButton>
    </div>
</template>

<script lang="ts">
import SuggestionCard from '@/components/SuggestionCard.vue';
import axios from 'axios';
import { base64Decode, base64Encode, Pianoroll } from '@/utils';
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
        const store = useStore();
        return { store };
    },
    data() {
        return {
            midiDataList: new Map<number, Uint8Array>(),
            positionToGenerate: -1,
            lastAccepted: -1
        }
    },
    methods: {
        handleGenerate() {
            this.store.generateCallback();
        },
        handleRemove(cardId: number) {
            this.midiDataList.delete(cardId);
        },
        handleAccept(cardId: number) {
            this.store.acceptSuggestionCallback(this.midiDataList.get(cardId)!);
            this.lastAccepted = cardId;
        },
        reset() {
            this.midiDataList.clear();
            this.lastAccepted = -1;
        },
        addSuggestion(midiData: Uint8Array) {
            const cardId = Math.random();
            this.midiDataList.set(cardId, midiData);
            if(this.midiDataList.size == 1){
                this.handleAccept(cardId);
            }
        }
    }
});
</script>

<style scoped>
.suggestion-panel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
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