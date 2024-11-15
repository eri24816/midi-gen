# Midi Generator

website: http://midi-gen.screamviola.csie.ncku.edu.tw/

## Overview

The Midi Generator is a web application that allows users to generate symbolic music based on a given prompt and desired musical attributes. An piano roll editor is provided for users to setup the prompt, refine the generated music, and listen to the generated music.

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

## Run Locally

Requires CUDA, Python >= 3.11, node.js >= 22.

### Development

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

### Docker

Note that the docker image will be huge (~6GB) because the dependencies of cuda and pytorch are huge.

```bash
docker build -t midi-gen .
docker run --name midi-gen -e CHECKPOINT_PATH=/volume/checkpoint.pt -v <path-to-volume>:/volume -p 8010:8010 --gpus all midi-gen
```

Where `<path-to-volume>` is the path to a volume directory that contains the checkpoint file `checkpoint.pt`.