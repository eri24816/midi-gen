import { AutoKeyupPiano } from '@/utils'
import { Piano } from '@tonejs/piano'
import { Tone } from '@tonejs/tone'

export const piano = new AutoKeyupPiano(new Piano({
    velocities: 5,
    volume: {
        pedal: -8,
        strings: -8,
        keybed: -8,
        harmonics: -8,
    }
}))

piano.piano.chain(Tone)