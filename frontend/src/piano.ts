import { AutoKeyupPiano } from '@/utils'
import { Piano } from '@tonejs/piano'

export const piano = new AutoKeyupPiano(new Piano({
    velocities: 5,
    volume: {
        pedal: -12,
        strings: -12,
        keybed: -12,
        harmonics: -12,
    }
}))