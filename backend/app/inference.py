import torch
from pianogen.model.model import SelectiveAttnTransformer
from pianogen.dataset.pianorolldataset import PianoRollDataset
from pianogen.dataset.tokenized import TokenizedPianoRollDataset
from pianogen.tokenizer import PianoRollTokenizer
from torch.utils.data import DataLoader
from pathlib import Path
from tqdm import tqdm
from pianogen.gpu_temp_control import GPUTempControl
from music_data_analysis import Pianoroll
import dotenv
import os

dotenv.load_dotenv(Path(__file__).parent/'.env')

CHECKPOINT_DIR = os.getenv('CHECKPOINT_DIR')
assert CHECKPOINT_DIR is not None


device = 'cuda'
from_epoch = 50


pr_ds = PianoRollDataset(r'W:\music\music-data-analysis\data', max_duration=32*150) # 150 bars
tokenizer = PianoRollTokenizer(n_pitch=88, n_velocity=32, token_seq_len=10240+1)
ds = TokenizedPianoRollDataset(pr_ds, tokenizer)
dl = DataLoader(ds,batch_size=8, shuffle=True, num_workers=8)


gpu_control = GPUTempControl(64,3)

tokenizer: PianoRollTokenizer
model: SelectiveAttnTransformer
def inference(length:int=512, prompt:Pianoroll|None=None, batch_size:int|None=None,method='nucleus', p=0.9, top_k:int=15):
    model.eval()
    if prompt is None:
        tokens = [{'type':'start'}]
    else:
        tokens = ds.tokenizer.tokenize(prompt, pad=False)
        print('prompt:', tokens[:10])
        print('prompt end:', tokens[-10:])

    indices = tokenizer.vocab.tokens_to_indices(tokens)
    pos = tokenizer.get_frame_indices(tokens, infer_next_frame=True)
    indices = indices.unsqueeze(0).to(device)
    pos = pos.unsqueeze(0).to(device)

    last_token = tokens[-1]

    for _ in tqdm(range(length)):
        gpu_control.cooldown()

        logits = model(indices,pos).squeeze(0)[-1].detach().cpu()
        new_token = tokenizer.sample_from_logits(logits, last_token, method='nucleus', p=0.9)
        tokens.append(new_token)
        last_token = new_token

        # update indices and pos

        new_token_idx = tokenizer.vocab.get_idx(new_token)
        indices = torch.cat([indices, torch.tensor([[new_token_idx]]).to(device)], dim=-1)
        if new_token['type'] == 'next_frame':
            new_pos = pos[0,-1] + 1
        else:
            new_pos = pos[0,-1]
        pos = torch.cat([pos, torch.tensor([[new_pos]]).to(device)], dim=-1)

        if new_token['type'] == 'end':
            break

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







