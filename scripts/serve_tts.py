#!/usr/bin/env python3.13
"""
StoryForge neural voice micro-service.

Serves the open-source Kokoro-82M v1.0 TTS model (Apache-2.0) over HTTP so the
web app can render natural, per-character voices. Each voice pack gets its own
identity; a playback pitch multiplier (ffmpeg) turns adult packs into kid voices.

Endpoints:
  GET  /health                  -> {ok, voices: [ids]}
  POST /tts {text, voice, speed, pitch} -> audio/wav (24 kHz mono)

Run:  python3.13 scripts/serve_tts.py   (port 8777)
"""

import hashlib
import io
import os
import subprocess
import sys
import tempfile
import threading

from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
import numpy as np
import soundfile as sf
import uvicorn

MODEL_PATH = os.environ.get(
    "KOKORO_MODEL", "/home/z/my-project/models/model.onnx"
)
VOICES_PATH = os.environ.get("KOKORO_VOICES", "/home/z/my-project/models/voices.bin")
CACHE_DIR = os.environ.get("KOKORO_CACHE", "/home/z/my-project/models/cache")
PORT = int(os.environ.get("TTS_PORT", "8777"))

app = FastAPI()
kokoro = None
voice_ids = []
lock = threading.Lock()


def load_model():
    global kokoro, voice_ids
    if kokoro is not None:
        return
    from kokoro_onnx import Kokoro

    kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

    # The onnx-community export expects style as [1, 256] while kokoro-onnx
    # passes a flat (256,) row — reshape transparently.
    import numpy as np

    orig_infer = kokoro._infer

    def patched_infer(tokens, style, speed):
        style = np.asarray(style, dtype=np.float32)
        if style.ndim == 1:
            style = style.reshape(1, -1)
        return orig_infer(tokens, style, speed)

    kokoro._infer = patched_infer

    try:
        voice_ids = sorted(kokoro.get_voices())
    except Exception:
        voice_ids = ["af_heart"]
    print(f"[serve_tts] loaded Kokoro with {len(voice_ids)} voices", flush=True)


def pitch_shift_wav(wav_bytes: bytes, pitch: float, sr: int) -> bytes:
    """Raise/lower playback pitch with ffmpeg while keeping duration."""
    if abs(pitch - 1.0) < 0.01:
        return wav_bytes
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(wav_bytes)
        src = f.name
    dst = src + ".shifted.wav"
    atempo = 1.0 / pitch
    # clamp atempo to ffmpeg's supported range
    if atempo < 0.5:
        atempo = 0.5
    if atempo > 2.0:
        atempo = 2.0
    af = f"asetrate={sr}*{pitch:.4f},aresample={sr},atempo={atempo:.4f}"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", af, dst],
        check=True,
    )
    with open(dst, "rb") as f:
        out = f.read()
    os.unlink(src)
    os.unlink(dst)
    return out


@app.get("/health")
def health():
    try:
        load_model()
        return {"ok": True, "voices": len(voice_ids)}
    except Exception as e:  # pragma: no cover
        return JSONResponse({"ok": False, "error": str(e)}, status_code=503)


@app.post("/tts")
def tts(body: dict):
    text = (body.get("text") or "").strip()
    voice = body.get("voice") or "af_heart"
    speed = float(body.get("speed") or 1.0)
    pitch = float(body.get("pitch") or 1.0)
    if not text:
        return JSONResponse({"error": "empty text"}, status_code=400)

    load_model()
    if voice_ids and voice not in voice_ids:
        voice = voice_ids[0]

    key = hashlib.sha1(
        f"{voice}|{speed:.3f}|{pitch:.3f}|{text}".encode()
    ).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{key}.wav")
    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            return Response(
                content=f.read(),
                media_type="audio/wav",
                headers={"Cache-Control": "public, max-age=31536000"},
            )

    with lock:  # onnxruntime inference is not thread-safe here
        samples, sample_rate = kokoro.create(
            text, voice=voice, speed=speed, lang="en-us"
        )

    buf = io.BytesIO()
    sf.write(buf, np.asarray(samples), sample_rate, format="WAV", subtype="PCM_16")
    wav_bytes = pitch_shift_wav(buf.getvalue(), pitch, sample_rate)

    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(cache_path, "wb") as f:
        f.write(wav_bytes)

    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={"Cache-Control": "public, max-age=31536000"},
    )


if __name__ == "__main__":
    os.makedirs(CACHE_DIR, exist_ok=True)
    print(f"[serve_tts] starting on :{PORT}", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
