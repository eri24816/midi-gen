<template>
    <div class="generate-tool">
        <MyButton class="generate-button" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">👾Generate</MyButton>
    </div>
</template>

<script lang="ts">
import MyButton from '@/components/MyButton.vue';
import { useStore } from '@/stores/counter';
import axios from 'axios';
import { base64Encode, base64Decode, Pianoroll } from '@/utils';
export default {
    name: 'GenerateTool',
    props: {
        numSamples: {
            type: Number,
            default: 4
        }
    },
    setup() {
        const store = useStore();
        return { store };
    },
    data() {
        return {
            beat: 0,
        };
    },
    methods: {
        handleDragStart(event: DragEvent) {
            console.log("👾DragStart");
            event.dataTransfer?.setData("tool", "Generate");
        },
        handleDragEnd(event: DragEvent) {
            if(this.store.pianorollEditor!.inBounds(event.clientX, event.clientY)) {
                this.beat = this.store.pianorollEditor!.screenToBeat(event.clientX);
                this.beat = Math.floor(this.beat/4)*4; // snap to bar
                this.store.suggestionPanel!.reset();
                this.store.generateCallback = this.generate;
                this.store.acceptSuggestionCallback = this.acceptSuggestion;
                this.generate();
            }
        },
        generate() {
            console.log("👾Generate", this.beat);
            for(let i = 0; i < this.numSamples; i++) {
                axios.post('/api/generate', {
                    midi: base64Encode(this.store.pianorollEditor!.pianoroll.slice(0,this.beat).toMidi().toArray()),
                    metadata: {
                    }
                }).then((response) => {
                    this.store.suggestionPanel!.addSuggestion(base64Decode(response.data.midi));
                });
            }
        },
        acceptSuggestion(midiData: Uint8Array) {
            console.log("👾AcceptSuggestion", this.beat);
            this.store.pianorollEditor!.pianoroll.removeSlice(this.beat, this.beat + 4);
            this.store.pianorollEditor!.pianoroll.overlapWith(new Pianoroll(midiData), this.beat);
            this.store.pianorollEditor!.render();
        }
    },
    components: {
        MyButton
    }
};
</script>

<style scoped>
.generate-tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.generate-button {
    font-size: 1.5em;
    padding: 10px 20px;
    display: inline-block;
    background-color: #000;
    color: #fff;
    border: 1px solid #fff;
    border-radius: 5px;
    cursor: pointer;
}
</style>