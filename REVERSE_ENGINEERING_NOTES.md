# Reverse-Engineering Notes — Plotagon → StoryForge Studio

This document records the **product teardown** that drove the implementation,
following the REA ("Reverse Engineer Anything") methodology from the
`risktaker-tz/REVERSE-ENGINEERING` fork of `morluto/rea`:

> investigate → collect evidence → explain how features work → build & test an
> implementation.

## 1. Target & method

- **Target:** Plotagon (plotagon.com) — a commercial "animated video maker"
  shipped as Plotagon Studio (desktop/mobile) and Plotagon Story (mobile).
- **Method:** website/web-target analysis only. Evidence was collected from the
  public marketing site (product pages, feature lists). The app's binaries,
  JavaScript bundles, and APIs were **not** decompiled, scraped, or probed —
  and no proprietary code, art, or audio from Plotagon exists anywhere in this
  repository.

## 2. Evidence — what the product does (from plotagon.com)

Observed pillars and feature names:

- **PLOT (storyboard):** users "create a timeline of audio visual content" and
  organize it with a storyboard tool.
- **SCENE:** "200+ virtual locations with thematic high-quality scenes."
- **ACTORS:** "create actors yourself or cast from our library, customize their
  look, dress and emotions"; Studio supports "independent emoting" and "more
  than 2 actors in scenes".
- **DIALOGUE / VOICE:** "Write the text, assign voices to your actors and
  assign listeners"; multilingual voice library, dialects, and the option to
  record your own voice.
- **EMOTE / ACTION:** emote animations for emotions; action tools for
  interactions (handshakes, high fives, hugs).
- **CAMERA:** customizable camera angles and transitions.
- **AUDIO:** music and audio layer.
- **INTERTITLE:** text cards between scenes.
- **Use cases advertised:** fan fiction, original narratives, social stories,
  training material, education, advertising.
- **Workflow advertised:** visualize idea → set scenes → cast & customize
  actors → write dialogue → add emotions/actions/camera/audio → storyboard →
  "generate an animated video in minutes".

**Limitations of evidence:** pricing, exact editors' UX, asset pipelines and
export internals are behind app installs / paywalls; they were inferred only at
the conceptual level from public descriptions.

## 3. Implementation mapping (clean-room)

| Plotagon concept | StoryForge Studio implementation | Where |
| --- | --- | --- |
| ACTORS | Parametric SVG character generator: skin tones, 8 hairstyles, hair colors, 6 outfits, outfit/pants colors, glasses | `src/lib/character-svg.ts`, `src/components/character-view.tsx` |
| VOICE | Web Speech API per-actor voice (voice picker, pitch, rate) with fallback timing; narrator voice | `src/lib/engine/tts.ts` |
| DIALOGUE | Ordered beats per shot; speaker per line (actor or narrator); "assign listeners" simplified to stage presence + speech bubbles + subtitles | `src/lib/types.ts`, `dialogue-panel.tsx`, `player.ts` |
| EMOTE | 6 canvas-drawn facial expressions (brows, eyes, mouth, blush) + per-line emotion overrides | `src/lib/emotions.ts` |
| ACTION | Entrances (walk-in L/R, fade), wave/jump/nod/shake, walk-off exit | `src/lib/engine/player.ts` |
| SCENE | 12 original vector backgrounds, rasterized via blob-URL SVG (canvas stays untainted for captureStream) | `src/lib/backgrounds/` |
| CAMERA | Wide / close-up-on-speaker / slow zoom-in per shot | `renderer.ts` (`applyCamera`) |
| Transitions | Cut / fade-from-black / slide-in per shot | `renderer.ts` |
| INTERTITLE | Title-card shots (big title + subtitle over any scene) | `renderer.ts`, `scene-panel.tsx` |
| PLOT (storyboard) | Shot list with reorder / duplicate / delete; timeline player | `shot-list.tsx`, `player.ts` |
| AUDIO | Procedural WebAudio score, toggleable, routed into the recording | `src/lib/engine/music.ts` |
| Generate video | MediaRecorder + canvas.captureStream → WebM download (picture + music + captions) | `src/lib/engine/recorder.ts` |

### Where this version aims to be *better*

1. **Zero install, zero account** — runs in any modern browser; Plotagon
   requires app installs and accounts.
2. **Free video export** — Plotagon gates exports/sharing behind subscription
   tiers; StoryForge exports WebM/JSON/PNG locally at no cost.
3. **Unlimited original cast** — no in-app purchases for content packs.
4. **Open & hackable** — the whole pipeline is readable TypeScript; scenes,
   hair, outfits and actions are pure data/functions that anyone can extend.
5. **Privacy** — projects never leave the browser (localStorage + file export).

## 4. Test evidence

Verified end-to-end in Chromium (dev server + automated browser):

- Home dashboard renders project cards with scene thumbnails.
- Studio: storyboard (4 shots), scene/cast/dialogue inspectors functional.
- Static preview draws background, two actors, per-beat emotion override,
  speech bubble with actor name, subtitle bar.
- Full playback: title card → café scene (walk-in entrance, 3 voiced beats,
  wave action) → night city close-up (emotions, shake action, narrator beat)
  → closing title card; stops cleanly.
- Character creator live-edits look (hairstyle switch reflected instantly).
- Video export recorded the entire sample story and returned to idle without
  errors.

## 5. Clean-room statement

The implementation was written from the public feature descriptions above —
a feature *spec*, not a copy of anyone's expression of it. All vector art,
layouts, characters, audio synthesis and code are original works created for
this repository. Plotagon is a trademark of its respective owner; this project
is not affiliated with or endorsed by them.
