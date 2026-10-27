# Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Reverse-engineer Plotagon.com per the REA methodology (fork risktaker-tz/REVERSE-ENGINEERING) and build + push an original, working web alternative to risktaker-tz/animation.

Work Log:
- Read REA repo README: methodology = investigate → evidence → explain → build implementation. Fork parent: morluto/rea.
- Attempted fork sync via GitHub merge-upstream API → BLOCKED: upstream changed `.github/workflows/cache-retention.yml` and the provided classic PAT lacks `workflow` scope. Left fork untouched. User fix: add `workflow` scope or click "Sync fork" in the GitHub UI.
- Plotagon teardown from plotagon.com (public marketing content only): pillars PLOT/SCENE/ACTORS/DIALOGUE/VOICE/EMOTE/ACTION/CAMERA/AUDIO/INTERTITLE, 200+ scenes, voice library, multi-actor scenes, interactions, camera angles/transitions, storyboard workflow. Documented in REVERSE_ENGINEERING_NOTES.md (clean-room statement included).
- Initialized fullstack Next.js 16 environment via init script.
- Built "StoryForge Studio" (original code/art, no third-party assets):
  - lib: types, 12 SVG background generators (indoor/outdoor), parametric character SVG generator, canvas emotion/face renderer, engine (image registry, renderer, timeline player with TTS + lip-sync approximation, procedural WebAudio music, MediaRecorder video export), zustand persisted store, sample story/cast.
  - UI: home dashboard (projects CRUD, import/export JSON), studio (storyboard, scene/cast/dialogue inspectors, canvas preview, play/stop, export dialog), character creator with live preview.
  - Single-route client app per sandbox constraint (view state, no extra Next routes).
- Fixed during verification: escaped-SVG-in-JSX bug (added SvgInline), canvas font `var()` invalid (computed font family), useMounted lint (useSyncExternalStore), ref-via-props lint (onCanvasReady callback), missing backgrounds/index.ts, type-only import runtime error, invalid CSS selector, setM typo.
- Browser-verified (agent-browser): home render, studio 3-col + mobile stack, static previews with bubble/subtitles, full sample-story playback (title → café walk-in + wave → night close-up + shake + narrator → end title), live character edit, export dialog records full story to WebM and returns idle. `bun run lint` clean, dev.log clean.
- Added README.md, REVERSE_ENGINEERING_NOTES.md, LICENSE (MIT), .gitignore additions (.zscripts/, db/, download/).
- Committed as 076de58 and pushed to https://github.com/risktaker-tz/animation (branch main). Token used inline for push only, then scrubbed from .git/config. No other repos touched.

Stage Summary:
- Deliverable: working StoryForge Studio app (runs on port 3000, `bun run dev`).
- Repo: risktaker-tz/animation @ main (2 commits; app commit 076de58).
- Security: PAT was shared in chat — recommend the user revoke/rotate it.
- Fork sync pending: needs `workflow` scope on the PAT (or GitHub UI sync).

---
Task ID: 2
Agent: main (Z.ai)
Task: Voice upgrade (open-source realistic TTS, unique per gender), silhouette-inspired characters, many more interactions, and a 2-minute exported test video (kid who loves animals).

Work Log:
- Researched + installed Kokoro-82M v1.0 ONNX (Apache-2.0, best open-source TTS): model.onnx (310 MB) + official voices-v1.0.bin (54 packs) from thewh1teagle/kokoro-onnx release.
- Built scripts/serve_tts.py (FastAPI :8777) with disk cache + ffmpeg pitch-shift (kid voices); monkey-patched style rank for the onnx-community export. Verified: 54 voices, ~1.3 s/line synthesis.
- Added src/app/api/tts proxy route; client voice engine src/lib/engine/voice.ts: curated 18-voice bank (female/male, US/UK), master WebAudio graph (voice+music+SFX → recorder stream), buffer prefetch/cache, Web Speech fallback, animal SFX synth.
- Silhouette art direction v2: rewrote character-svg.ts (realistic proportions, adult/child geometry, duotone + rim-light pass, 25 arm/body poses), emotions.ts (luminous faces, glasses, lip-sync), animals.ts (dog/cat/bird silhouette sprites with idle/bark/run/sit/wag variants).
- Interactions v2 (Plotagon's weakness): types.ts ACTION_META with 30+ actions in 5 categories; two-actor interactions (hug/highfive/give/whisper/pet/fetch) with approach/return travel; FX overlay system in renderer (hearts, sparkles, notes, tears, dust, ball arc…); new engine/director.ts = pure deterministic timeline shared by browser player AND offline renderer; player.ts rewritten (scheduled neural audio at exact offsets, real-duration beats); music.ts routed into master graph.
- UI: character creator (kind/age/species/voice bank/preview), dialogue panel (grouped action picker + interaction partner select), export dialog now records voices+music+SFX, studio prefetches voices in background.
- Demo story src/lib/story-max-rex.ts: "Max & Rex: The Homework Trick" (33 lines, 7 shots, kid+Mom+Dad+dog+cat).
- Test/export: scripts/render_video.ts (headless Chromium frame-stepping via director + ffmpeg mix) + make_music.py bed → download/max-and-rex-story.mp4 (1280×720 H.264/AAC, 122.1 s). Verified frames at 8 timestamps + audio levels (peak −0.9 dB).
- Browser-verified: home, studio, playback, 0 console errors; lint clean; tsc clean.
- Committed 093a5e0 and pushed to risktaker-tz/animation (main). Only content files staged (sandbox chmod artifacts excluded); models/ (350 MB) gitignored; nothing else touched.

Stage Summary:
- App: working, neural voices + silhouette cast + 30+ interactions, seeds Max & Rex story.
- Video deliverable: /home/z/my-project/download/max-and-rex-story.mp4 (2 min 2 s) + .storyforge.json bundle.
- Repo: risktaker-tz/animation @ main (commit 093a5e0).
- Ops note: run `python3 scripts/serve_tts.py` for voices (README has setup); voices disk-cache at models/cache.
