from pydantic import BaseModel

class MidiGenerationRequest(BaseModel):
    midi: str  # Base64 encoded MIDI file
    conditions: dict

class ExtractRequest(BaseModel):
    midi: str  # Base64 encoded MIDI file