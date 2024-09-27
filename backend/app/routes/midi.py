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
        input_pr = Pianoroll.from_midi_data(BytesIO(midi_data))
        

        print('input_pr:', input_pr.duration, len(input_pr.notes))
        pr = inference(duration=32, prompt=input_pr)
        pr = pr.slice(input_pr.duration)

        buffer = BytesIO()
        pr.to_midi().dump(file=buffer)
        buffer.seek(0)
              
        generated_midi = base64.b64encode(buffer.getvalue()).decode()
        
        return {"midi": generated_midi}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))