#!/usr/bin/env python3
"""Contact sheet 3x3 for the rendered story video."""
import subprocess, tempfile, os
from PIL import Image

VID = '/home/z/my-project/download/max-and-rex-story.mp4'
OUT = '/home/z/my-project/download/max-and-rex-preview.jpg'
# spread across the story: title, entrance, write, talk, sneak, fetch, highfive, read, hug/exit
TS = [3, 10, 22, 34, 45, 57, 74, 92, 116]

frames = []
with tempfile.TemporaryDirectory() as td:
    for i, t in enumerate(TS):
        p = os.path.join(td, f'{i}.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', VID,
                        '-frames:v', '1', p], check=True)
        frames.append(Image.open(p).resize((426, 240)))
    sheet = Image.new('RGB', (426 * 3, 240 * 3), 'black')
    for i, im in enumerate(frames):
        sheet.paste(im, ((i % 3) * 426, (i // 3) * 240))
    sheet.save(OUT, quality=90)
print('saved', OUT, sheet.size)
