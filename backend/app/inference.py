import torch
from pianogen.model.model import SelectiveAttnTransformer
from pianogen.tokenizer import PianoRollTokenizer
from pathlib import Path
from tqdm import tqdm
from pianogen.gpu_temp_control import GPUTempControl
from music_data_analysis import Pianoroll
import dotenv
import os
from typing import Literal
dotenv.load_dotenv(Path(__file__).parent/'.env')

CHECKPOINT_DIR = os.getenv('CHECKPOINT_DIR')
assert CHECKPOINT_DIR is not None


device = 'cuda'
from_epoch = 80

tokenizer = PianoRollTokenizer(n_pitch=88, n_velocity=32, token_seq_len=10240+1)

gpu_control = GPUTempControl(64,3)

tokenizer: PianoRollTokenizer
model: SelectiveAttnTransformer
def inference(duration:float=32, prompt:Pianoroll|None=None, batch_size:int|None=None,method:Literal['top_k', 'nucleus']='nucleus', p=0.9, top_k:int=15):
    model.eval()
    if prompt is None:
        tokens = [{'type':'start'}]
    else:
        tokens = tokenizer.tokenize(prompt, pad=False)
        print('duration:', prompt.duration, sum(t['type']=='next_frame' for t in tokens))
        print('prompt:', tokens[:10])
        print('prompt end:', tokens[-10:])

    indices = tokenizer.vocab.tokens_to_indices(tokens)
    pos = tokenizer.get_frame_indices(tokens, infer_next_frame=True)
    indices = indices.unsqueeze(0).to(device)
    pos = pos.unsqueeze(0).to(device)

    last_token = tokens[-1]
    duration_generated = 0
    pbar = tqdm(range(32))
    for _ in range(int(duration*100)):
        gpu_control.cooldown()

        logits = model(indices,pos).squeeze(0)[-1].detach().cpu()
        new_token = tokenizer.sample_from_logits(logits, last_token, method=method, p=p, top_k=top_k)
        tokens.append(new_token)
        last_token = new_token

        # update indices and pos

        new_token_idx = tokenizer.vocab.get_idx(new_token)
        indices = torch.cat([indices, torch.tensor([[new_token_idx]]).to(device)], dim=-1)
        if new_token['type'] == 'next_frame':
            new_pos = pos[0,-1] + 1
            duration_generated += 1
            pbar.update(1)
        else:
            new_pos = pos[0,-1]
        pos = torch.cat([pos, torch.tensor([[new_pos]]).to(device)], dim=-1)

        if new_token['type'] == 'end':
            break
    
        if duration_generated >= duration:
            break
    pbar.close()
    print('duration generated:', sum(t['type']=='next_frame' for t in tokens))
    return tokenizer.detokenize(tokens)



checkpoint_dir = Path(CHECKPOINT_DIR)
print('loading model...')
model = SelectiveAttnTransformer(len(tokenizer.vocab),128,256)
model.set_downsampled_path_enabled(True)

checkpoint = torch.load(checkpoint_dir/f'{from_epoch}.pt')
model.load_state_dict(checkpoint['model'])
model = model.to(device)

model.eval()

print('model loaded')







