from io import BytesIO
import traceback
from fastapi import APIRouter, HTTPException
from ..models import MidiGenerationRequest
import base64
from music_data_analysis.data import Pianoroll

from ..inference import inference

router = APIRouter()

@router.post("/generate")
async def generate_midi(request: MidiGenerationRequest):
    try:
        # Decode the base64 MIDI file
        midi_data = base64.b64decode(request.midi)
        pr = Pianoroll.from_midi_data(BytesIO(midi_data))
        
        # TODO: Implement MIDI processing and generation logic here
        
        # new_pr = Pianoroll([ # c c g g a a g f f e e d d c
        #     Note(0, 60, 100, 100), # c
        #     Note(4, 60, 100, 100), # c
        #     Note(8, 67, 100, 100), # g
        #     Note(12, 67, 100, 100), # g
        #     Note(16, 69, 100, 100), # a
        #     Note(20, 69, 100, 100), # a
        #     Note(24, 67, 100, 100), # g
        #     Note(28, 65, 100, 100), # f
        #     Note(32, 65, 100, 100), # f
        #     Note(36, 64, 100, 100), # e
        #     Note(40, 64, 100, 100), # e
        #     Note(44, 62, 100, 100), # d
        #     Note(48, 62, 100, 100), # d
        #     Note(52, 60, 100, 100), # c
            
        # ])
        pr = inference(prompt=pr)

        # For now, we'll just return the same MIDI data
        buffer = BytesIO()
        pr.to_midi().dump(file=buffer)
        import miditoolkit
        buffer.seek(0)
        print(miditoolkit.midi.parser.MidiFile(file=buffer).instruments[0].notes[:5])

        print(pr.to_midi().instruments[0].notes[:5])
              
        generated_midi = base64.b64encode(buffer.getvalue()).decode()
        
        return {"midi": generated_midi}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))