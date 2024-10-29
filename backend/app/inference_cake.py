from typing import Literal
from music_data_analysis import Pianoroll
import torch
from pathlib import Path
import dotenv
import os

from pianogen.model.with_feature import Cake
from pianogen.dataset.with_feature import FeatureDataset



dotenv.load_dotenv(Path(__file__).parent/'.env')

CHECKPOINT_PATH = os.getenv('CHECKPOINT_PATH')
assert CHECKPOINT_PATH is not None


device = 'cuda'

model = Cake(a0_size=512, max_len=150, dim_model=256, num_layers=6, num_heads=8, dim_feedforward=1024)

checkpoint = torch.load(CHECKPOINT_PATH)
model.load_state_dict(checkpoint['model'])
model = model.to(device).eval()

def inference(prompt:Pianoroll, duration:int=32, batch_size:int=1,method:Literal['top_k', 'nucleus']='nucleus', p=0.9, top_k:int=15):
    if prompt.duration == 0:
        generated = model.generate(duration//32, batch_size)
        pr = model.indices_to_pianoroll(generated['piano_roll']['indices'])
        return pr
    
    prompt_ds = FeatureDataset.from_piano_roll(prompt, loaders=model.get_loaders())
    print(prompt.duration)
    print(prompt_ds[0]['piano_roll']['indices'].shape)
    generated = model.generate(prompt.duration//32 + duration //32, batch_size, prompt_ds[0])
    print(generated['piano_roll']['indices'][0][-1].shape, generated['piano_roll']['indices'][0][-1])
    pr = model.indices_to_pianoroll(generated['piano_roll']['indices'][0][-1])
    print(pr.duration)
    prompt_ds.delete()
    
    return pr


print('model loaded')







