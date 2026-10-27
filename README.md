# StoryForge Studio

An original, browser-based **animation story maker** — create humans *and
animals*, pick scenes, write dialogue, and watch your story play itself with
**realistic neural voices**, emotions, camera moves, interactions and music.
Then export it as a video.

Inspired by the feature set of commercial story-animation tools such as
Plotagon (see `REVERSE_ENGINEERING_NOTES.md` for the full product teardown that
drove this build). **All code, vector art and assets in this repository are
original** — nothing was copied from any third-party app.

## What makes this better than Plotagon

- **Open-source neural voices (Kokoro-82M, Apache-2.0)** — 18 curated,
  genuinely realistic voice packs across female/male, American/British. Every
  character gets a unique voice; a pitch-lift slider turns any pack into a
  believable child voice. No robotic Web Speech defaults.
- **Silhouette-inspired art direction** — cinematic near-black duotone
  characters with colored rim light and luminous facial features. Realistic
  proportions (adults and children), far from clip-art cartoonish.
- **Animal actors** — dogs, cats and birds with their own sprite variants
  (bark, wag, run, sit) and pitched novelty voices.
- **30+ interactions** (Plotagon's weak spot): activity poses (write, read,
  phone, sneak, sit, dance…), expressive actions (laugh, cry, gasp, facepalm,
  think…), and true **two-actor interactions** — hug, high-five, give/receive,
  whisper, pet an animal, throw a ball for a fetch — with travel, synced poses
  and effect overlays (hearts, sparkles, notes, dust, ball arc).
- **Deterministic director engine** — the timeline is computed from the real
  audio durations, so on-screen playback, lip-sync and exported video are
  perfectly in sync.

## Features

| Area | What you get |
| --- | --- |
| Character creator | Humans (adult/child) + animals (dog/cat/bird), 8 hairstyles, rim-light palette, outfits, glasses. Unlimited cast, saved locally. |
| Voices | Kokoro neural voice bank with per-character assignment, speed + pitch-lift sliders, preview button, narrator voice-over. |
| Scenes | 12 hand-built vector backgrounds (café, city day/night, classroom, office, spaceship, beach, park, stage, …). |
| Emotions & actions | 6 facial emotions with animated lip-sync; 30+ actions and interactions (see above). |
| Camera & transitions | Wide shot, close-up on speaker, slow zoom; cut / fade / slide transitions; cinematic vignette. |
| Storyboard | Ordered shots (scenes + title cards), reorder/duplicate/delete, per-shot cast & dialogue. |
| Audio | Neural voice lines + procedural score + animal SFX, all mixed through one WebAudio graph. |
| Export | One-click WebM video (picture + voices + score + captions), PNG frame grab, project JSON export/import. |
| Offline renderer | `scripts/render_video.ts` produces a frame-perfect H.264 MP4 of a story via headless Chromium + ffmpeg. |
| Privacy | Projects persist in localStorage; video export runs fully client-side. |

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
```

The app seeds a demo cast (Max, Mom, Dad, Rex the dog, Whiskers the cat) and a
full sample story ("Max & Rex: The Homework Trick") on first launch — press
**Play story** to hear the neural voices and see the interactions.

## Enabling the neural voices

Voices are served by a local micro-service wrapping the open-source
**Kokoro-82M v1.0** ONNX model:

```bash
# one-time downloads (~350 MB total)
pip install kokoro-onnx onnxruntime soundfile fastapi uvicorn
mkdir -p models && cd models
curl -LO https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# start the voice service (port 8777)
python3 scripts/serve_tts.py
```

The Next.js route `/api/tts` proxies to it. When the service is offline the app
falls back to browser speech / timed captions automatically. Synthesized lines
are disk-cached, so second runs are instant.

### Rendering the demo story to MP4 (optional)

```bash
python3 scripts/serve_tts.py &        # voice service
bun scripts/render_video.ts           # → download/max-and-rex-story.mp4
```

## Project structure

```
src/
  app/api/tts/            # proxy to the Kokoro micro-service
  components/
    home-view.tsx         # projects dashboard
    studio-view.tsx       # editor shell + toolbar
    studio/               # canvas preview, shot list, inspector panels, export dialog
    character-view.tsx    # character creator (humans + animals + voice bank)
  lib/
    types.ts              # domain model (Project/Shot/CastEntry/Beat/Character)
    story-max-rex.ts      # demo story script
    backgrounds/          # 12 vector scene generators
    character-svg.ts      # parametric silhouette character generator (25 poses)
    animals.ts            # dog/cat/bird silhouette sprites + variants
    emotions.ts           # luminous facial expression renderer
    engine/
      director.ts         # pure deterministic timeline simulation
      renderer.ts         # scene compositor + interaction FX
      player.ts           # director-driven playback + scheduled audio
      voice.ts            # Kokoro voice bank, master audio graph, buffer cache
      music.ts            # procedural WebAudio score
      recorder.ts         # MediaRecorder video export
      images.ts           # SVG sprite registry
    store.ts              # zustand persisted store
scripts/
  serve_tts.py            # Kokoro-82M voice micro-service
  render_video.ts         # offline MP4 renderer (headless Chromium + ffmpeg)
  make_music.py           # offline music-bed synthesizer
```

## Known limitations & roadmap

- First playback after a cold start synthesizes each line once (~1 s per line,
  serialized on CPU); lines are cached on disk and in memory afterwards.
- Mouth animation is a stylized lip-sync approximation, not phoneme-accurate.
- Roadmap: recorded voice-overs (getUserMedia), more species & scenes,
  multi-language voices, phoneme lip-sync, subtitle styling.

## License

MIT — see `LICENSE`.
