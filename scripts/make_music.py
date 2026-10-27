#!/usr/bin/env python3.13
"""Generate the gentle orchestral bed for the offline render (matches the
in-app procedural score: C-Am-F-G loop, 2s per chord, pad + soft plucks)."""

import sys
import wave

import numpy as np

SR = 24000
CHORDS = [
    [261.63, 329.63, 392.0],   # C
    [220.0, 261.63, 329.63],   # Am
    [174.61, 220.0, 261.63],   # F
    [196.0, 246.94, 293.66],   # G
]


def synth(duration_s: float) -> np.ndarray:
    n = int(duration_s * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, dtype=np.float64)

    chord_len = 2.0
    n_chords = int(np.ceil(duration_s / chord_len))
    for ci in range(n_chords):
        chord = CHORDS[ci % len(CHORDS)]
        start = ci * chord_len
        i0 = int(start * SR)
        i1 = min(n, int((start + chord_len + 0.4) * SR))
        seg = t[i0:i1] - start
        # pad: soft sines with slow attack + release
        for k, f in enumerate(chord):
            env = np.clip(seg / 0.5, 0, 1) * np.clip((chord_len + 0.4 - seg) / 0.7, 0, 1)
            out[i0:i1] += 0.055 / (k + 1.6) * env * np.sin(2 * np.pi * f * seg + ci)
            out[i0:i1] += 0.012 / (k + 1.6) * env * np.sin(2 * np.pi * f * 2 * seg)
        # plucks: gentle eighth-note arpeggio
        for step in range(4):
            ts = start + step * 0.5
            j0 = int(ts * SR)
            j1 = min(n, j0 + int(0.55 * SR))
            if j0 >= n:
                break
            tt = (np.arange(j1 - j0)) / SR
            f = chord[step % 3] * 2 * (2 if step == 3 else 1)
            env = np.exp(-tt * 6.5) * np.clip(tt / 0.012, 0, 1)
            out[j0:j1] += 0.035 * env * np.sin(2 * np.pi * f * tt)

    # global fade in/out
    fade = int(1.2 * SR)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    # normalize to -14 dBFS-ish
    peak = np.abs(out).max() or 1.0
    out *= 0.2 / peak
    return out


def main(duration_s: float, path: str) -> None:
    audio = synth(duration_s)
    pcm = (audio * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"music bed: {duration_s:.1f}s -> {path}")


if __name__ == "__main__":
    main(float(sys.argv[1]), sys.argv[2])
