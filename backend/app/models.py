from pydantic import BaseModel

class MidiGenerationRequest(BaseModel):
    midi: str  # Base64 encoded MIDI file
    metadata: dict