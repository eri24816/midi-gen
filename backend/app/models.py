from pydantic import BaseModel

class MidiGenerationRequest(BaseModel):
    midi_file: str  # Base64 encoded MIDI file
    metadata: dict