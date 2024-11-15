from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

midi_api = FastAPI()
# Include routes
midi_api.include_router(midi.router)

app.mount("/api", midi_api)
app.mount("/", StaticFiles(directory="static", html=True), name="frontend")
