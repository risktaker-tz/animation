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

---
Task ID: 3
Agent: main (Z.ai)
Task: Deliver the exported video so the user can watch it in-browser and save it to their local Downloads.

Work Log:
- Verified max-and-rex-story.mp4 integrity (ffprobe: 122.1 s, 1280x720, h264+aac, 5.49 MB).
- Generated 3x3 contact sheet download/max-and-rex-preview.jpg (verified with PIL).
- Found live preview origin in dev.log: preview-chat-e0fa60dd-0d04-4348-83e5-c52a97f6bc95.space-z.ai.
- Copied mp4 + jpg into public/ and created public/watch.html (cinematic watch page: inline player, poster, big Download button with download attr, studio link, feature chips).
- Verified serving via Host-header curl: watch.html/mp4/jpg all HTTP 200 with correct content-types.
- Created GitHub release demo-video-v1 on risktaker-tz/animation (id 425054685) with mp4 + jpg + storyforge.json assets; confirmed asset download 200 (5,487,849 bytes) with auth.
- Discovered repo is private -> release link requires user logged into GitHub; preview link is the anonymous-friendly path.
- Committed public/ watch page + video as 390f6e7 and pushed to main (only the 3 new files staged).

Stage Summary:
- Watch page: https://preview-chat-e0fa60dd-0d04-4348-83e5-c52a97f6bc95.space-z.ai/watch.html (play + one-click download).
- Direct file: .../max-and-rex-story.mp4 (same origin).
- Permanent backup: https://github.com/risktaker-tz/animation/releases/download/demo-video-v1/max-and-rex-story.mp4 (needs GitHub login; repo is private).
- Repo: main @ 390f6e7. Nothing else on GitHub touched.

---
Task ID: 4
Agent: main (Z.ai)
Task: User feedback round — ultra-realistic 3D-cartoon characters (no more dark silhouettes), natural movements, distinct voices, natural interactions; re-export video.

Work Log:
- Rewrote character-svg.ts (v3): volumetric soft-3D shading — radial skin gradients, cylindrical 3-layer limbs, fabric gradients + side shade + highlights, hair sheen, ears, nose volume, shoes with soles; added walkA/walkB stride poses; cache keys bumped.
- Rewrote emotions.ts: big cartoon eyes (sclera shading, radial iris from new look.irisColor, pupil, 2 catchlights), deterministic per-character blinking (blinkOpenAt), gaze offsets, nose/blush/lip rendering, restyled glasses.
- Rewrote animals.ts: fur palettes with radial gradients + belly light + ear inner + glossy eyes (golden dog, silver cat); removed non-deterministic Date.now tail.
- director.ts: breathing/micro-sway idles (per-cast phase), walk-cycle sprite alternation on entrances/travel/exit/run, eased 3-phase interaction choreography (walk-in, contact micro-motion incl. hug sway/highfive recoil/whisper lean-in/pet strokes, walk-back), squash & stretch jump + landing dust, gaze-at-speaker pass, phrase-gap lip-sync, child drawH, exit walk-off, animal bubble height fix.
- renderer.ts: scaleX/scaleY/lean application, blink+gaze wiring, tMs in FrameState, gift FX, restingVisual child sizing.
- voice.ts: bank expanded to 24 Kokoro voices, dog default am_puck→am_fenrir, added ensureUniqueVoices() dedupe guard (wired into player, render_video, render-entry).
- story: bright outfits (green hoodie/rose sweater/blue blazer), realistic skin tones, iris colors, Rex voice → am_fenrir (fixes Max/Rex shared-voice clash), added hug finale; runtime 2:05.
- Fixed pre-existing render_video.ts bug: frame timestamp `t` undefined → `i * frameStepMs`.
- Verified: tsc clean, lint clean, 14 spot-check frames visually inspected.
- Render: dev server killed to fit 4 GB RAM (next 1.45 GB + TTS 743 MB + chromium); 3747 frames @30fps → download/max-and-rex-story.mp4 (124.9 s, 7.58 MB, peak −0.9 dB). Restarted dev via supervisor loop.
- Discovered sandbox reaps ALL background processes between Bash tool calls (canary-verified); persistent preview requires the Complete deploy path.
- Deliveries: new contact sheet, public/ assets, GitHub release demo-video-v2 (mp4 + jpg + fresh storyforge json), commit 4914cb8 pushed to main.

Stage Summary:
- Video v2: download/max-and-rex-story.mp4 (2:05) — colorful 3D-cartoon cast, walk cycles, blinking/gaze, unique voices (Max=Puck+1.22, Rex=Fenrir+1.5, Mom=Heart, Dad=Michael, Whiskers=Sky, Narrator=George).
- Release: https://github.com/risktaker-tz/animation/releases/tag/demo-video-v2
- Repo: main @ 4914cb8. Only animation repo touched.
- Ops note: dev server needs Complete-tool redeploy to persist (sandbox reaps background children).

---
Task ID: 5
Agent: main (Z.ai)
Task: User feedback round 2 — character interaction facing (left/right/front/back) not implemented well, arms sometimes missing, improve interactions and chemistry.

Work Log:
- Root-caused missing arms: both arm limbs were drawn BEHIND the torso in buildCharacterSvg, so any pose with hands near the body (write/read/hug/give/clap/sad/pet) had arms swallowed by the outfit. Refactored into shared bodyParts() and now renders BOTH arms in front of the torso (figure order: legs → neck → torso → armR → armL → hair → head → props).
- Fixed prop/pose mismatches: phone now held at ear height, write pencil under the hand, pet pose reaches down to animal height.
- Built a full orientation system: Facing = front/left/right/back. Deterministic facing-cue track in director.ts (buildFacingCues/applyFacingCues): entrances face the walk direction then settle front; speakers and their targets turn toward each other in dialogue; interaction actors face partners (and home while walking back); exit beats turn the back. Renderer applies a cartoon pivot (FACING_SCALE lerp through edge-on), 3/4 profile faces via new yaw param in emotions.drawFace (features slide + squeeze + profile nose hint), face fade at edge-on, and new back-view sprites (buildCharacterBackSvg: per-hairstyle back hair, back outfit incl. hoodie hood, no face).
- Animals: flip now derives from facing (fetch dog faces its run direction and turns back to the thrower; petted animals face the petter).
- Interaction chemistry: per-action stand-off distances (hug 112 / whisper 108 / highfive 152 / give 136 / pet 165 / fetch 235), partner steps halfway for hug/high-five, actor raises the acting arm before arriving (anticipation), partner reactions during walk-back (cheer after high-five/give, shock after whisper, hug lingering), impact recoil tuned, speech bubbles bias 150px away from the interaction partner.
- Exit rework: character turns around (back view) first, then walks off into the distance with recede + 12% shrink + fade.
- Preload: back-view sprites for all poses in images.ts + render-entry.ts; renderer falls back to front sprite if a back key is missing.
- drawStaticFrame: editor previews now face the stage middle when multiple cast members are present.
- Story: added dialogue targets across all conversation beats (Mom/Max, Dad/Max, Max/Rex) + new finale beat "Come on, Rex — let's go tell everyone!" with back-view exit; runtime 121.7 s.
- Verification: new scripts/preview_frames.ts + crop_preview.py; visually inspected 17 timestamp crops (write arms, conversation facing both sides, hug contact, high-five contact + partner cheer reaction, fetch toss/run flip, pet stroke, read, entrance, pivot turn, back view walk-off). tsc clean, lint clean, browser console clean, home/watch/mp4 all 200.
- Render: resumable two-phase renderer (frames/ then assemble/) — 3650 frames @30fps → download/max-and-rex-story.mp4 (121.7 s, 1280×720 h264+aac, 7.4 MB). New contact sheet + fresh storyforge bundle.
- Delivery: assets refreshed in public/, GitHub release demo-video-v3 (id 425112664, mp4+jpg+json uploaded), commit 3292c1b pushed to main (only animation repo touched).

Stage Summary:
- Video v3: download/max-and-rex-story.mp4 (2:02) — characters face each other in every conversation, no more vanishing arms, natural turn-takings, back-view walk-off finale.
- Release: https://github.com/risktaker-tz/animation/releases/tag/demo-video-v3
- Repo: main @ 3292c1b. Nothing else on GitHub touched.
- Ops note: preview persistence needs the Complete deploy path (sandbox reaps background processes).
