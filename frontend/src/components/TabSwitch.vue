<template>
    <div class="tab-switch">
        <div class="tab-buttons">
            <button 
                v-for="(tab, index) in tabs" 
                :key="index"
                :class="{ active: currentTab === index }"
                @click="currentTab = index"
            >
                {{ tab.title }}
            </button>
        </div>
        <div class="tab-content">
            <slot :name="tabs[currentTab].name"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
    name: 'TabSwitch',
    props: {
        tabs: {
            type: Array as () => Array<{title: string, name: string}>,
            required: true
        }
    },
    setup() {
        const currentTab = ref(0)
        return {
            currentTab
        }
    }
})
</script>

<style scoped>
.tab-switch {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tab-buttons {
    display: flex;
    flex-shrink: 0;
}

.tab-buttons button {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.tab-buttons button.active {
    background-color: #404040;
}

.tab-content {
    flex-grow: 1;
    padding: 10px;
    overflow-y: auto;
}
</style>
