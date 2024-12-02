<template>

    <h2>Save & Load</h2>
    <FileInput @change="emit('load', $event)" />
    <MyButton @click="emit('save')">Save as MIDI</MyButton>


    <h2>Templates</h2>
    Try these templates to get you started.
    <br>
    <b>Don't forget to re-generate each bar after applying a template.</b>
    <div class="templates">
        <h3> Chord Progressions</h3>
        <div v-for="template in chordTemplates" :key="template.name">
            <MyButton @click="emit('useTemplate', template)">{{ template.name }}</MyButton>
        </div>
        <h3> Dynamic Patterns</h3>
        <div v-for="template in dynamicTemplates" :key="template.name">
            <MyButton @click="emit('useTemplate', template)">{{ template.name }}</MyButton>
        </div>
    </div>
</template>

<style scoped></style>

<script setup lang="ts">
import FileInput from "@/components/FileInput.vue";
import MyButton from "@/components/MyButton.vue";
const emit = defineEmits(["load", "save", "useTemplate"]);

const dynamicTemplates: Record<string, any>[] = [

    {
        "name": "Constant pp",
        "attributes": {
            "velocity": [60,60,60,60,60,60,60,60]
        }
    },
    {
        "name": "Constant mp",
        "attributes": {
            "velocity": [80,80,80,80,80,80,80,80]
        }
    },
    {
        "name": "Constant mf",
        "attributes": {
            "velocity": [95,95,95,95,95,95,95,95]
        }
    },
    {
        "name": "Constant ff (the AI might get a bit crazy 🙁)",
        "attributes": {
            "velocity": [120,120,120,120,120,120,120,120]
        }
    },
    {
        "name": "Crescendo",
        "attributes": {
            "velocity": [60,70,78,86,94,102,105,110]
        }
    },
    {
        "name": "Decrescendo",
        "attributes": {
            "velocity": [110,105,102,98,76,70,67,60]
        }
    },
    {
        "name": "Up then down",
        "attributes": {
            "velocity": [60,67,78,93,102,95,88,80]
        }
    },
    {
        "name": "Down then up",
        "attributes": {
            "velocity": [100,95,90,80,85,92,102,110]
        }
    },
    {
        "name": "Alternating",
        "attributes": {
            "velocity": [100,60,100,60,100,60,100,60]
        }
    }
]

const chordTemplates: Record<string, any>[] = [
    {
        "name": "Circle of Fifths 1",
        "attributes": {
            "chord": ["Am", "Dm", "G", "C", "F", "Bb", "B", "E"]
        }
    },
    {
        "name": "Circle of Fifths 2",
        "attributes": {
            "chord": ["Am7", "Dm7", "G7", "CM7", "FM7", "Bo","E7", "Am7"]
        }
    },
    {
        "name": "Stand By Me",
        "attributes": {
            "chord": ["C", "Am", "F", "G", "C", "Am", "F", "G"]
        }
    },
    {
        "name": "Through the Arbor",
        "attributes": {
            "chord": ["C", "Gsus4", "Am", "F", "C", "G7", "C", "G"]
        }
    },
    {
        "name": "Am F C G",
        "attributes": {
            "chord": [
                "Am",
                "F",
                "C",
                "G",
                "Am",
                "F",
                "C",
                "G",
            ]
        }
    },
    {
        "name": "Am G D7 D",
        "attributes": {
            "chord": ["Am", "G", "D7", "D", "Am", "G", "D7", "D"]
        }
    },
    {
        "name": "F G Em Am Dm G C",
        "attributes": {
            "chord": [
                "FM7",
                "G7",
                "Em",
                "Am",
                "Dm",
                "G7",
                "C",
                "C7",
            ]
        }
    },
    {
        "name": "C D E (funny)",
        "attributes": {
            "chord": [
                "C D E",
                "C D E",
                "C D E",
                "C D E",
            ]
        }
    },
    {
        "name": "C G Am Em F C F G",
        "attributes": {
            "chord": [
                "C",
                "G",
                "Am",
                "Em",
                "F",
                "C",
                "F",
                "G",
            ]
        }
    },
]


</script>