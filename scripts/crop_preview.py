#!/usr/bin/env python3
"""Crop inspection regions from preview frames at full resolution."""
from PIL import Image
import sys

JOBS = [
    # (src, box, out)
    ("write-arms",   (500, 330, 780, 680),  "crop-write-max"),
    ("talk-to-mom-facing", (860, 240, 1160, 660), "crop-mom-facing"),
    ("talk-to-mom-facing", (540, 320, 760, 680),  "crop-max-facing"),
    ("kid-reply-facing",   (540, 300, 800, 680),  "crop-max-reply"),
    ("hug-contact",  (300, 200, 1000, 680), "crop-hug"),
    ("highfive-contact", (300, 200, 1050, 680), "crop-highfive"),
    ("highfive-react",   (300, 200, 1050, 680), "crop-highfive-react"),
    ("exit-back-walk",   (100, 200, 700, 700),  "crop-exit-back"),
    ("exit-back-turn",   (100, 200, 700, 700),  "crop-exit-turn"),
    ("fetch-run",    (700, 350, 1200, 680), "crop-fetch-run"),
    ("pet-stroke",   (350, 300, 900, 680),  "crop-pet"),
    ("entrance-mom", (700, 150, 1200, 680), "crop-entrance"),
    ("read-book",    (350, 280, 800, 680),  "crop-read"),
    ("dad-point-facing", (750, 200, 1250, 680), "crop-dad-point"),
]

src_dir = "/home/z/my-project/models/preview"
out_dir = "/home/z/my-project/models/preview"

for src, box, out in JOBS:
    im = Image.open(f"{src_dir}/{src}.png")
    crop = im.crop(box)
    # upscale 2x for readability
    crop = crop.resize((crop.width * 2, crop.height * 2), Image.LANCZOS)
    crop.save(f"{out_dir}/{out}.png")
    print(f"{out}: {crop.size}")
