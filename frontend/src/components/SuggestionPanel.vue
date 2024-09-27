<template>
    <div class="suggestion-panel">
        <h2>Suggestions</h2>
        <div class="scroll-container">
            <div class="scroll-content">
                <SuggestionCard v-for="midiData in midiDataList" :midiData="midiData" />
            </div>
        </div>

        <MyButton @clicked="handleGenerate">Generate Bar</MyButton>
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
            midiDataList: [] as ArrayBuffer[]
        }
    },
    methods: {
        handleGenerate() {
            axios.post('/api/generate', {
                midi: base64Encode(this.storeInstance.mainPianoroll.toMidi().toArray()),
                metadata: {
                    title: 'Generated MIDI',
                    artist: 'AI',
                    album: 'Generated'
                }
            }).then((response) => {
                //this.storeInstance.mainPianoroll = new Pianoroll(base64Decode(response.data.midi));
                this.midiDataList.push(base64Decode(response.data.midi));
            });
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
}

.scroll-container {
    overflow: scroll;
}

.scroll-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
}

.suggestion-card {
    height: 200px;
    margin: 0 20px;
}
</style>