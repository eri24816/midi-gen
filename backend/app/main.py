from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import midi

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust this to match your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(midi.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the MIDI Next Bar Generator API"}