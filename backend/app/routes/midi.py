from io import BytesIO
import traceback
from fastapi import APIRouter, HTTPException
from ..models import MidiGenerationRequest
import base64
from music_data_analysis.data import Pianoroll

router = APIRouter()

@router.get("/load-midi")
async def load_midi():
    try:
        # TODO: Implement logic to load MIDI file
        # For now, we'll just return a dummy MIDI file
        dummy_midi = base64.b64encode(b"Dummy MIDI data").decode()
        return {"midiData": dummy_midi}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_midi(request: MidiGenerationRequest):
    try:
        # Decode the base64 MIDI file
        midi_data = base64.b64decode(request.midi)
        pr = Pianoroll.from_midi_data(BytesIO(midi_data))
        
        # TODO: Implement MIDI processing and generation logic here
        
        # pr.notes.append(Note(onset=1, pitch=60, velocity=100, offset=10))

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