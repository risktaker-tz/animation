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
