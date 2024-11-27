<template>
    <div class="attribute-cell" ref="el">
        <input type="text" v-model.lazy="userValue"/>
    </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue';
import { useAttributeCellLogic } from './AttributeCellLogic';

const el = ref<HTMLElement | null>(null);
const realValue = defineModel<string>('realValue', {default: ''});
const userValue = defineModel<string>('userValue', {default: ''});
const isDetermined = defineModel<boolean>('isDetermined', {default: false});
const {validator} = defineProps<{
    validator: (value: string) => boolean;
}>();
const {} = useAttributeCellLogic<string>(el, realValue, userValue, isDetermined, validator);


defineExpose({
    realValue,
    userValue,
    isDetermined,
});

</script>

<style scoped>
    .attribute-cell {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #1e1e1e;
    }
    .attribute-cell.determined {
        background-color: #fff20027;
    }
    input {
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
        text-align: center;
        border: none;
        background-color: transparent;
    }
</style>
