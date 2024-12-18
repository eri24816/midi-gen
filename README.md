# Music Generator

A web app that allows you to create your own music. Ask AI for help whenever you need.


![Image](https://i.imgur.com/NPsGTeL.png)

![Static Badge](https://img.shields.io/badge/Vue3-359369) 
![Static Badge](https://img.shields.io/badge/TypeScript-27609e)
![Static Badge](https://img.shields.io/badge/PR-welcome-blue)
![Static Badge](https://img.shields.io/badge/website-http%3A%2F%2Fmidi.eri24816.tw%2F-orange)



## Features

### AI Backend (powered by [piano-music-gen](https://github.com/eri24816/piano-music-gen))
The AI model at the backend is capable of generating a bar of symbolic music based on maximum 15 previous bars as the prompt and desired attributes of the current bar. It's a modified transformer model trained on symbolic piano music (piano covers of pop songs transcribed to midi).

### Editor

The piano roll editor makes the generation process interactive. It allows users to input the prompt and desired attributes to condition the generative model. It's also okay to input nothing and let the model generate everything from scratch. The editor also allows users to listen to the generated music and manually refine the music. The interactiveness is important because at the same time, we need AI for providing inspiration and human for really making the music sound good and reasonable.

Usage:
- Press the generate buttons to generate music of a bar.
- Specify desired attributes before generation to guide the generation. The entry will become yellow when an attribute is specified. Right click to reset the attribute to be unspecified (which will be generated randomly).
- Left click or drag to add notes.
- Right click or drag to remove notes.
- Play the music and listen to the generated music.
- Load or save the music as a midi file.

## Develop Frontend

Requires node.js >= 22.

```bash
cd frontend
npm install
npm run dev
```

The dev server will proxy the `/api` requests to the deployed backend (http://midi.eri24816.tw/api), so you don't need to run the backend server locally.

## Develop Backend (the AI model)

Requires CUDA, Python >= 3.11, 

If you want to run the backend (the AI model) locally, follow these steps:

1. Download the checkpoint file from [here](https://drive.google.com/drive/folders/1319U0Bauntrv5aUrQjSgQ2b6goeJeAOD?usp=sharing).

2. Set the `CHECKPOINT_PATH` environment variable to the path to the checkpoint file. Optionally, you can create `backend/app/.env` and put the following line in it:

```
CHECKPOINT_PATH=<path-to-checkpoint>
```

3. Run the backend server:
```bash
cd backend
pip install -e .
uvicorn app.main:app --reload
```

4. Run the frontend dev server:
```bash
cd frontend
npm install
npm run dev-local
```

## Docker

```bash
docker build -t midi-gen .
docker run --name midi-gen -e CHECKPOINT_PATH=/volume/checkpoint.pt -v <path-to-volume>:/volume -p 8010:8010 --gpus all midi-gen
```

Where `<path-to-volume>` is the path to a volume directory that contains the checkpoint file `checkpoint.pt`.

Note that the docker image will be huge (~6GB) because the dependencies of cuda and pytorch are huge.
