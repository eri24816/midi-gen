<template>
    <div class="toolbox">
        <div class="tab-switch">
            <MyButton @click="currentTool = 'GenerateTool'" :class="{ active: currentTool === 'GenerateTool' }">Generate</MyButton>
            <MyButton @click="currentTool = 'ToolB'" :class="{ active: currentTool === 'ToolB' }">Tool B</MyButton>
            <MyButton @click="currentTool = 'ToolC'" :class="{ active: currentTool === 'ToolC' }">Tool C</MyButton>
        </div>
        <component :is="currentTool"></component>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import MyButton from '@/components/MyButton.vue';
import GenerateTool from './GenerateTool.vue';

export default defineComponent({
    name: 'ToolBox',
    components: {
        MyButton,
        GenerateTool,
    },
    setup() {
        const currentTool = ref('ToolA');
        return { currentTool };
    }
});
</script>

<style scoped>
.toolbox {
    display: flex;
    flex-direction: column;
}

.tab-switch {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 10px;
    gap: 10px;
    flex-basis: 30px;
    flex-grow: 0;
    flex-shrink: 0;
}

.tab-switch button {
    padding: 5px 10px;
    margin-right: 5px;
    cursor: pointer;
}

.tab-switch button:not(.active) {
    background-color: #303030;
}

.tab-switch button.active {
    font-weight: bold;
}
</style>