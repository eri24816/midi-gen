from io import BytesIO
import traceback
from fastapi import APIRouter, HTTPException

from ..inference_cake import extract_features, inference
from ..models import ExtractRequest, MidiGenerationRequest
import base64
from music_data_analysis.data import Pianoroll


router = APIRouter()

@router.post("/generate")
async def generate_midi(request: MidiGenerationRequest):
    try:
        # Decode the base64 MIDI file
        midi_data = base64.b64decode(request.midi)
        conditions = request.conditions
        input_pr = Pianoroll.from_midi_data(BytesIO(midi_data))
        

        print('input_pr:', input_pr.duration, len(input_pr.notes))
        print('conditions:', conditions)
        pr = inference(duration=32, prompt=input_pr, conditions=conditions)
        

        buffer = BytesIO()
        pr.to_midi().dump(file=buffer)
        buffer.seek(0)
              
        generated_midi = base64.b64encode(buffer.getvalue()).decode()
        
        return {"midi": generated_midi}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/extract")
async def extract(request: ExtractRequest):
    try:
        midi_data = base64.b64decode(request.midi)
        pr = Pianoroll.from_midi_data(BytesIO(midi_data))
        features = extract_features(pr)
        return features
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))