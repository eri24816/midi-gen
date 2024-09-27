import { ref, computed } from 'vue'
import { defineStore, type StoreDefinition } from 'pinia'
import PianorollEditor from '@/components/PianorollEditor.vue'
import SuggestionsPanel from '@/components/SuggestionPanel.vue'
import { AutoKeyupPiano } from '@/utils'
import { Piano } from '@tonejs/piano'
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

// has to explicitly define the type because circular references of types
export const useStore: StoreDefinition<string, {
  pianorollEditor: InstanceType<typeof PianorollEditor> | null,
  suggestionPanel: InstanceType<typeof SuggestionsPanel> | null,
  generateCallback: () => void,
  acceptSuggestionCallback: (midiData: Uint8Array) => void,
}> = defineStore('store', {
  state: () => ({
    pianorollEditor: null as InstanceType<typeof PianorollEditor> | null,
    suggestionPanel: null as InstanceType<typeof SuggestionsPanel> | null,
    generateCallback: () => {},
    acceptSuggestionCallback: (midiData: Uint8Array) => {}
  }),
  actions: {
  }
})