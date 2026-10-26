# StoryForge Studio

An original, browser-based **animation story maker** — create actors, pick scenes,
write dialogue, and watch your story play itself with voices, emotions, camera
moves and music. Then export it as a video.

Inspired by the feature set of commercial story-animation tools such as
Plotagon (see `REVERSE_ENGINEERING_NOTES.md` for the full product teardown that
drove this build). **All code, vector art and assets in this repository are
original** — nothing was copied from any third-party app.

## Features

| Area | What you get |
| --- | --- |
| Character creator | 6 skin tones, 8 hairstyles, 8 hair colors, 6 outfit styles + colors, pants colors, glasses. Unlimited cast, saved locally. |
| Voices | Per-actor browser TTS voice with pitch & speed sliders, voice picker, narrator voice-over beats. |
| Scenes | 12 hand-built vector backgrounds (café, city day/night, classroom, office, spaceship, beach, park, stage, …). |
| Emotions & actions | 6 facial emotions (neutral, happy, sad, angry, surprised, scared) with animated lip-sync while speaking; walk-in/fade entrances, wave, jump, nod, shake, walk-off actions. |
| Camera & transitions | Wide shot, close-up on speaker, slow zoom; cut / fade / slide transitions. |
| Storyboard | Ordered shots (scenes + title/intertitle cards), reorder/duplicate/delete, per-shot cast & dialogue. |
| Audio | Procedural background score (WebAudio) with WebM audio-track capture. |
| Export | One-click WebM video recording (picture + score + burned-in captions), PNG frame grab, project JSON export/import. |
| Privacy | Everything runs client-side. No account, no upload, projects persist in localStorage. |

## Tech stack

- **Next.js 16 (App Router) + TypeScript**
- **Tailwind CSS 4 + shadcn/ui** (New York) components
- **Zustand** (persisted store) for projects & cast
- Custom **canvas rendering engine** (`src/lib/engine/`):
  - `renderer.ts` — scene compositor (backgrounds, sprites, dynamic faces, speech bubbles, subtitles, camera, transitions)
  - `player.ts` — async timeline driver (shots → beats → TTS → mouth flaps → actions)
  - `tts.ts` — Web Speech API wrapper with timing fallback
  - `music.ts` — procedural WebAudio score
  - `recorder.ts` — MediaRecorder/captureStream video export
- Parametric **SVG character & background generators** rasterized to canvas (blob URLs keep the canvas untainted so video export works)

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
```

The app seeds a demo cast (Maya & Leo) and a sample story ("The Midnight Scoop")
on first launch — press **Play story** in the studio to see everything working.

## Project structure

```
src/
  app/                    # Next.js app router (single-page app shell)
  components/
    home-view.tsx         # projects dashboard
    studio-view.tsx       # editor shell + toolbar
    studio/               # canvas preview, shot list, inspector panels, export dialog
    character-view.tsx    # character creator
  lib/
    types.ts              # domain model (Project/Shot/CastEntry/Beat/Character)
    backgrounds/          # 12 vector scene generators
    character-svg.ts      # parametric character sprite generator
    emotions.ts           # canvas facial expression renderer
    engine/               # renderer, player, tts, music, recorder, image registry
    store.ts              # zustand persisted store
    sample.ts             # seed cast + sample story
```

## Known limitations & roadmap

- Browser TTS audio cannot be captured into the exported WebM (platform
  limitation) — the video includes music + captions; for a voiced track,
  screen-record with audio.
- Mouth animation is a stylized lip-sync approximation, not phoneme-accurate.
- Roadmap: recorded voice-overs (getUserMedia), more scenes/hairstyles,
  background music picker, phoneme lip-sync, subtitle styling, i18n.

## License

MIT — see `LICENSE`.
