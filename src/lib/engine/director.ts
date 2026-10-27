import type {
  Beat,
  BeatAction,
  CastEntry,
  Character,
  Emotion,
  Position,
  Project,
  Shot,
} from '@/lib/types';
import { NARRATOR_VOICE, isAnimal } from '@/lib/types';
import { POSE_FOR_ACTION, type Pose } from '@/lib/character-svg';
import { variantForAction, type AnimalVariant } from '@/lib/animals';
import type { CastVisual, FrameState, FxInstance, FxKind, Facing } from './renderer';
import { POSITION_X, drawHFor, restingVisual, animalDrawH } from './renderer';

// ---------------------------------------------------------------------------
// Director: pure, deterministic timeline simulation.
// The same code drives in-browser playback and the offline video renderer,
// so both produce identical, audio-synced animation.
// ---------------------------------------------------------------------------

export const TRANSITION_MS = 620;
export const ENTER_MS: Record<string, number> = {
  none: 0,
  fade: 550,
  walkLeft: 1500,
  walkRight: 1500,
  runLeft: 1050,
  runRight: 1050,
};
const BEAT_GAP = 240;
const SHOT_PAD = 620;
const TITLE_MS = 3200;

/** How long each action's animation runs (ms) */
export const ACTION_MS: Partial<Record<BeatAction, number>> = {
  none: 0,
  wave: 1700,
  jump: 1200,
  nod: 1100,
  shake: 1100,
  exit: 1050,
  clap: 1300,
  point: 1200,
  shrug: 1100,
  think: 1500,
  cheer: 1400,
  sulk: 1300,
  laugh: 1500,
  cry: 1700,
  gasp: 900,
  dance: 2400,
  sit: 900,
  write: 1600,
  read: 1600,
  phone: 1400,
  sneak: 1500,
  run: 1500,
  facepalm: 1200,
  salute: 1100,
  hug: 2300,
  highfive: 2100,
  give: 2300,
  whisper: 2200,
  pet: 2500,
  fetch: 2700,
  bark: 1100,
  meow: 1000,
  chirp: 900,
  wag: 1500,
};

export interface BeatTiming {
  shotIndex: number;
  beatId: string;
  startMs: number;
  endMs: number;
  characterId: string | null;
  targetCharacterId: string | null;
  text: string;
  action: BeatAction;
  emotion: Emotion | 'inherit';
  audioDurMs: number;
}

export interface ShotTiming {
  index: number;
  shotId: string;
  kind: 'scene' | 'title';
  startMs: number;
  endMs: number;
  transitionMs: number;
}

export interface AudioCue {
  beatId: string;
  characterId: string | null;
  text: string;
  startMs: number;
  durMs: number;
}

export interface Timeline {
  totalMs: number;
  shots: ShotTiming[];
  beats: BeatTiming[];
  audio: AudioCue[];
}

const INTERACTION_ACTIONS = new Set<BeatAction>(['hug', 'highfive', 'give', 'whisper', 'pet', 'fetch']);
const TRAVEL_OUT = 0.72; // fraction of the beat when the walk back begins
const STEP_MS = 150; // walk-cycle frame length
/** How close the actor stands to the partner at the moment of contact.
 *  Hugs/whispers are intimate, high-fives need swing room, fetch needs throw room. */
const STAND_OFF: Partial<Record<BeatAction, number>> = {
  hug: 112,
  whisper: 108,
  highfive: 152,
  give: 136,
  pet: 165,
  fetch: 235,
};

// ---------------------------------------------------------------- walking
// Stride-synced locomotion: the body only travels as fast as the feet step,
// with per-step acceleration out of standstill, deceleration into the stop,
// a vertical bob that peaks at the passing pose, and a settle on arrival.

const WALK_STEP_MS = 155; // cadence target per step (one pose frame) at cruise
const RUN_STEP_MS = 112;

export type WalkPose = 'walkA' | 'walkB' | 'walkMid';

interface WalkState {
  x: number;
  /** px the body rises at the passing pose (subtract from footY) */
  lift: number;
  pose: WalkPose | 'idle';
  lean: number;
  sway: number;
}

interface WalkOpts {
  run?: boolean;
  /** already at cruising speed when the clock starts (entrances, walk-offs) */
  cruise?: boolean;
  /** slow to a stop at the end (skip for characters leaving the stage) */
  stop?: boolean;
}

/**
 * Deterministic walker: maps elapsed time → position/pose for a journey of
 * `dist` px completed in `dur` ms. The journey is split into n whole steps
 * (cadence ≈ WALK/RUN_STEP_MS); each step carries a weight multiplier so the
 * character eases out of standstill, cruises, then pulls up naturally.
 * Foot speed matches ground speed inside every step → no more skating.
 */
function walkTravel(
  fromX: number,
  toX: number,
  elapsedMs: number,
  durMs: number,
  opts: WalkOpts = {}
): WalkState {
  const dist = toX - fromX;
  const adist = Math.abs(dist);
  const dir = dist >= 0 ? 1 : -1;
  const run = !!opts.run;
  const targetStep = run ? RUN_STEP_MS : WALK_STEP_MS;

  const rest: WalkState = { x: toX, lift: 0, pose: 'idle', lean: 0, sway: 0 };
  if (durMs <= 60 || adist < 6) return rest;

  // step count from cadence (longer journeys stretch the stride, not the cadence)
  const n = Math.max(1, Math.min(28, Math.round(durMs / targetStep)));
  const stepMs = durMs / n;

  // per-step weights: ease-in (0.55→1), cruise, ease-out (1→0.5)
  const accel = opts.cruise ? 0 : Math.min(2, n - 1);
  const decel = opts.stop === false ? 0 : Math.min(2, n - 1);
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    let w = 1;
    if (accel > 0 && i < accel) w = 0.55 + 0.45 * ((i + 1) / accel);
    if (decel > 0 && i >= n - decel) {
      const k = (i - (n - decel) + 1) / decel;
      w = Math.min(w, 1 - 0.5 * k);
    }
    weights.push(w);
  }
  const wSum = weights.reduce((a, b) => a + b, 0);
  const unit = adist / wSum;
  const cum: number[] = [0];
  for (let i = 0; i < n; i++) cum.push(cum[i] + weights[i] * unit);

  const u = Math.max(0, Math.min(1, elapsedMs / durMs));
  if (u >= 1) return rest;
  const sf = u * n;
  const i = Math.min(n - 1, Math.floor(sf));
  const frac = sf - i;

  const x = fromX + dir * (cum[i] + (cum[i + 1] - cum[i]) * frac);
  const bobH = run ? 7.5 : 5;
  const lift = Math.sin(Math.PI * frac) * bobH * weights[i];
  // contact frames book-end each step; the passing pose fills the middle
  const pose: WalkPose = frac < 0.52 ? (i % 2 === 0 ? 'walkA' : 'walkB') : 'walkMid';
  const lean = dir * (run ? 0.085 : 0.045) * (0.6 + 0.4 * (weights[i] / wSum) * n);
  const sway = Math.sin(Math.PI * (i + frac) * 2) * 0.007;
  return { x, lift, pose, lean, sway };
}

/** In-place stride cycle (jogging on the spot) — 4-frame loop */
function stridePose(elapsedMs: number, stepMs = STEP_MS): Pose {
  const f = Math.floor(elapsedMs / stepMs) % 4;
  return f === 0 ? 'walkA' : f === 1 ? 'walkMid' : f === 2 ? 'walkB' : 'walkMid';
}

// ---------------------------------------------------------------- turning

/** How long a pivot takes, by angle — bigger turns get more stage time */
function turnMsFor(from: Facing, to: Facing): number {
  const side = (f: Facing) => f === 'left' || f === 'right';
  if (side(from) && side(to)) return 340; // about-face through profile
  if (from === 'back' || to === 'back') {
    return side(from) || side(to) ? 400 : 460; // half turn around
  }
  return 280; // quarter turn, front <-> side
}

// ---------------------------------------------------------------- facing

interface FacingCue {
  atMs: number;
  facing: Facing;
}

function faceToward(meX: number, otherX: number): Facing {
  return otherX >= meX ? 'right' : 'left';
}

/**
 * Deterministic orientation cues for one cast member across a shot.
 * People turn toward whomever they talk to / act with, face their walk
 * direction during entrances, turn their back when leaving, and settle
 * facing the audience (animals settle toward the stage middle) when
 * addressing it.
 */
function buildFacingCues(
  entry: CastEntry,
  shot: Shot,
  shotTiming: { startMs: number },
  beatTimings: BeatTiming[],
  enterMs: number,
  settle: Facing = 'front'
): FacingCue[] {
  const cues: FacingCue[] = [];
  const homeX = POSITION_X[entry.position];

  // entrances: face the walk direction, then settle
  if (entry.enter === 'walkLeft' || entry.enter === 'runLeft') {
    cues.push({ atMs: shotTiming.startMs, facing: 'right' });
    cues.push({ atMs: shotTiming.startMs + enterMs, facing: settle });
  } else if (entry.enter === 'walkRight' || entry.enter === 'runRight') {
    cues.push({ atMs: shotTiming.startMs, facing: 'left' });
    cues.push({ atMs: shotTiming.startMs + enterMs, facing: settle });
  }

  for (const bt of beatTimings) {
    const beat = shot.beats.find((b) => b.id === bt.beatId);
    if (!beat) continue;
    const dur = Math.max(1, bt.endMs - bt.startMs);

    if (bt.characterId === entry.characterId) {
      if (bt.targetCharacterId) {
        const tEntry = shot.cast.find((c) => c.characterId === bt.targetCharacterId);
        if (tEntry) {
          const tX = POSITION_X[tEntry.position];
          cues.push({ atMs: bt.startMs, facing: faceToward(homeX, tX) });
          if (INTERACTION_ACTIONS.has(beat.action)) {
            // face home while walking back, settle afterwards
            cues.push({ atMs: bt.startMs + dur * TRAVEL_OUT, facing: homeX <= 640 ? 'left' : 'right' });
            cues.push({ atMs: bt.endMs, facing: settle });
          }
        }
      } else if (beat.action === 'exit') {
        // turn the back to the camera early, then walk off into the distance
        cues.push({ atMs: bt.startMs + dur * 0.08, facing: 'back' });
      } else {
        cues.push({ atMs: bt.startMs, facing: settle });
      }
    } else if (bt.targetCharacterId === entry.characterId && beat.action !== 'exit') {
      const aEntry = bt.characterId ? shot.cast.find((c) => c.characterId === bt.characterId) : undefined;
      if (aEntry) {
        const aX = POSITION_X[aEntry.position];
        cues.push({ atMs: bt.startMs, facing: faceToward(homeX, aX) });
        if (beat.action === 'fetch') {
          // the dog dashes after the ball, then comes back to the thrower
          const away: Facing = aX > homeX ? 'left' : 'right';
          cues.push({ atMs: bt.startMs + dur * 0.3, facing: away });
          cues.push({ atMs: bt.startMs + dur * 0.46, facing: faceToward(homeX, aX) });
        }
      }
    }
  }

  cues.sort((a, b) => a.atMs - b.atMs);
  return cues;
}

function applyFacingCues(
  v: CastVisual,
  cues: FacingCue[],
  tMs: number,
  defaultFacing: Facing = 'front'
): void {
  if (!cues.length) {
    v.facing = defaultFacing;
    v.facingFrom = defaultFacing;
    v.turnK = 1;
    return;
  }
  let idx = cues.findIndex((c) => tMs < c.atMs);
  if (idx === -1) idx = cues.length;
  const cur = cues[Math.max(0, idx - 1)];
  const prev = cues[Math.max(0, idx - 2)] ?? cur;
  v.facing = cur.facing;
  v.facingFrom = prev.facing;
  // pivot duration depends on the angle being turned through
  v.turnK = Math.max(0, Math.min(1, (tMs - cur.atMs) / turnMsFor(prev.facing, cur.facing)));
}

export function actionDuration(a: BeatAction): number {
  return ACTION_MS[a] ?? 0;
}

function easeInOutSine(p: number): number {
  const c = Math.max(0, Math.min(1, p));
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

/** deterministic 0..1 hash (breathing phase offsets, etc.) */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Build the deterministic timeline. audioDur maps beatId → audio length in ms. */
export function buildTimeline(
  project: Project,
  characters: Record<string, Character>,
  audioDur: Record<string, number>
): Timeline {
  const shots: ShotTiming[] = [];
  const beats: BeatTiming[] = [];
  const audio: AudioCue[] = [];
  let t = 0;

  project.shots.forEach((shot, index) => {
    const transitionMs = shot.transition === 'cut' ? 0 : TRANSITION_MS;
    const shotStart = t;
    const enterMax = shot.kind === 'title' ? 0 : Math.max(0, ...shot.cast.map((c) => ENTER_MS[c.enter] ?? 0));

    let cursor = shotStart + Math.max(transitionMs, enterMax);

    if (shot.kind === 'title') {
      const titleAudio = shot.beats.reduce((m, b) => Math.max(m, audioDur[b.id] ?? 0), 0);
      const dur = Math.max(TITLE_MS, titleAudio + 700);
      for (const b of shot.beats) {
        if (b.text) {
          audio.push({
            beatId: b.id,
            characterId: b.characterId,
            text: b.text,
            startMs: shotStart + 350,
            durMs: audioDur[b.id] ?? 1200,
          });
        }
      }
      cursor = shotStart + dur;
      beats.push(
        ...shot.beats.map((b) => ({
          shotIndex: index,
          beatId: b.id,
          startMs: shotStart + 350,
          endMs: shotStart + dur,
          characterId: b.characterId,
          targetCharacterId: null,
          text: b.text,
          action: b.action,
          emotion: b.emotion,
          audioDurMs: audioDur[b.id] ?? 0,
        }))
      );
    } else {
      for (const b of shot.beats) {
        const audioMs = audioDur[b.id] ?? estimateMs(b.text);
        const actionMs = effectiveActionMs(b, shot, characters);
        const beatDur = (b.text ? Math.max(actionMs, audioMs) : Math.max(420, actionMs)) + 180;
        beats.push({
          shotIndex: index,
          beatId: b.id,
          startMs: cursor,
          endMs: cursor + beatDur,
          characterId: b.characterId,
          targetCharacterId: resolveTarget(b, shot),
          text: b.text,
          action: b.action,
          emotion: b.emotion,
          audioDurMs: audioMs,
        });
        if (b.text) {
          audio.push({
            beatId: b.id,
            characterId: b.characterId,
            text: b.text,
            startMs: cursor + 60,
            durMs: audioMs,
          });
        }
        cursor += beatDur + BEAT_GAP;
      }
    }

    const end = cursor + (shot.kind === 'title' ? 0 : SHOT_PAD);
    shots.push({
      index,
      shotId: shot.id,
      kind: shot.kind,
      startMs: shotStart,
      endMs: end,
      transitionMs,
    });
    t = end;
  });

  return { totalMs: t + 350, shots, beats, audio };
}

function resolveTarget(b: Beat, shot: Shot): string | null {
  if (!b.targetId) return null;
  const entry = shot.cast.find((c) => c.id === b.targetId);
  return entry?.characterId ?? null;
}

function effectiveActionMs(
  b: Beat,
  shot: Shot,
  characters: Record<string, Character>
): number {
  let ms = actionDuration(b.action);
  if (b.action === 'exit') ms = 1050;
  // interactions travel toward the partner
  if (INTERACTION_ACTIONS.has(b.action) && b.targetId) ms += 0; // travel folded into anim below
  void shot;
  void characters;
  return ms;
}

/** Rough caption duration when no neural audio is available */
export function estimateMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(14000, Math.max(1100, 420 + words * 330));
}

// ---------------------------------------------------------------- frame state

export interface ActiveBeat {
  timing: BeatTiming;
  beat: Beat;
  progress: number; // 0..1 within beat
}

/**
 * Compute the complete visual state at time `tMs`.
 * Pure function of (project, characters, timeline, tMs).
 */
export function frameStateAt(
  project: Project,
  characters: Record<string, Character>,
  timeline: Timeline,
  tMs: number
): FrameState & { fx: FxInstance[] } {
  const shotIdx = Math.max(
    0,
    timeline.shots.findIndex((s) => tMs >= s.startMs && tMs < s.endMs)
  );
  const shotTiming = timeline.shots[shotIdx] ?? timeline.shots[0];
  const shot = project.shots[shotIdx] ?? project.shots[0];
  const t = Math.max(0, tMs);

  const visuals: CastVisual[] = shot.cast.map((entry) => {
    const ch = characters[entry.characterId];
    const v = restingVisual(entry, ch);
    if (ch && isAnimal(ch)) {
      v.drawH = animalDrawH(ch, entry.position);
      v.flip = entry.position === 'right';
    } else {
      v.drawH = drawHFor(entry.position, false, ch?.look.age);
    }
    return v;
  });
  const byId = new Map(visuals.map((v) => [v.castId, v]));

  // --- entrances (stride-synced walk / run cycles)
  for (const entry of shot.cast) {
    const enterMs = ENTER_MS[entry.enter] ?? 0;
    if (enterMs <= 0) continue;
    const since = t - shotTiming.startMs;
    const p = Math.min(1, since / enterMs);
    const v = byId.get(entry.id);
    if (!v) continue;
    if (entry.enter === 'fade') {
      v.alpha = easeOutCubic(p);
    } else {
      const dir = entry.enter === 'walkLeft' || entry.enter === 'runLeft' ? -1 : 1;
      const from = dir < 0 ? -420 : 1700;
      const run = entry.enter.startsWith('run');
      const w = walkTravel(from, v.x, since, enterMs, { run, cruise: true });
      v.x = w.x;
      if (p < 1) {
        v.pose = w.pose;
        v.footY -= w.lift;
        v.lean = w.lean;
        v.rotation = (v.rotation ?? 0) + w.sway;
      }
    }
  }

  // --- active beat
  const beatTiming = timeline.beats.find((b) => b.shotIndex === shotIdx && t >= b.startMs && t < b.endMs);
  let beatText: string | null = null;
  let beatCharacterId: string | null = null;
  let speakingCharacterId: string | null = null;
  let talkOpen = 0;
  const fx: FxInstance[] = [];

  if (shot.kind !== 'title' && beatTiming) {
    const beat = shot.beats.find((b) => b.id === beatTiming.beatId);
    if (beat) {
      const beatDur = Math.max(1, beatTiming.endMs - beatTiming.startMs);
      const p = Math.min(1, (t - beatTiming.startMs) / beatDur);
      const actor = beat.characterId ? byId.get(castIdOf(shot, beat.characterId)) : undefined;
      const actorCh = beat.characterId ? characters[beat.characterId] : undefined;
      const target = beatTiming.targetCharacterId
        ? byId.get(castIdOf(shot, beatTiming.targetCharacterId))
        : undefined;
      const targetCh = beatTiming.targetCharacterId ? characters[beatTiming.targetCharacterId] : undefined;

      // emotion override
      if (actor && beat.emotion !== 'inherit') {
        actor.emotion = beat.emotion;
      } else if (target && beat.emotion !== 'inherit' && INTERACTION_ACTIONS.has(beat.action)) {
        target.emotion = beat.emotion;
      }

      applyAction(beat.action, actor, actorCh, target, targetCh, p, t - beatTiming.startMs, fx, beatDur);

      if (beat.text) {
        beatText = beat.text;
        beatCharacterId = beat.characterId;
        const audioStart = beatTiming.startMs + 60;
        if (t >= audioStart && t < audioStart + beatTiming.audioDurMs + 120) {
          speakingCharacterId = beat.characterId;
          const at = (t - audioStart) / 1000;
          // syllable flutter × phrase gaps → readable, human lip movement
          const flutter = Math.abs(Math.sin(at * 11.0) * (0.65 + 0.35 * Math.sin(at * 2.4)));
          const phrase = Math.sin(at * 2.9 + 0.6);
          const gap = phrase < -0.72 ? 0.12 : 1;
          talkOpen = (0.18 + 0.82 * flutter) * gap;
        }
      }
    }
  } else if (shot.kind === 'title') {
    const tb = shot.beats.find((b) => b.text && t >= shotTiming.startMs + 350);
    if (tb) {
      beatText = tb.text;
      beatCharacterId = tb.characterId;
      const audioStart = shotTiming.startMs + 350;
      const dur = timeline.beats.find((b) => b.beatId === tb.id)?.audioDurMs ?? estimateMs(tb.text);
      if (tb.characterId === null && t < audioStart + dur + 120) {
        speakingCharacterId = null;
      }
    }
  }

  // --- orientation: who faces where (deterministic cue track) ---
  const shotBeatTimings = timeline.beats.filter((b) => b.shotIndex === shotIdx);
  for (const entry of shot.cast) {
    const v = byId.get(entry.id);
    if (!v) continue;
    const ch = characters[entry.characterId];
    if (ch && isAnimal(ch)) {
      // animal sprites are side views — they settle facing the stage middle
      const faceCenter: Facing = entry.position === 'right' ? 'left' : 'right';
      const cues = buildFacingCues(entry, shot, shotTiming, shotBeatTimings, ENTER_MS[entry.enter] ?? 0, faceCenter);
      applyFacingCues(v, cues, t, faceCenter);
      if (v.facing === 'left') v.flip = true;
      else if (v.facing === 'right') v.flip = false;
      else if (v.facing === 'front') v.flip = entry.position === 'right';
    } else {
      const cues = buildFacingCues(entry, shot, shotTiming, shotBeatTimings, ENTER_MS[entry.enter] ?? 0);
      applyFacingCues(v, cues, t);
    }
  }

  // --- fx from speaking/target state (spawned continuously by applyAction above)

  // --- gaze: everyone looks at whoever is speaking / acting
  const focusV = speakingCharacterId
    ? visuals.find((v) => v.characterId === speakingCharacterId)
    : beatTiming && beatTiming.characterId
      ? byId.get(castIdOf(shot, beatTiming.characterId))
      : undefined;
  if (focusV) {
    const focusHeadY = focusV.footY - focusV.drawH * 0.8;
    for (const v of visuals) {
      if (v === focusV || !v.visible) continue;
      const myHeadY = v.footY - v.drawH * 0.8;
      v.gazeDx = Math.max(-1, Math.min(1, (focusV.x - v.x) / 340));
      v.gazeDy = Math.max(-0.7, Math.min(0.7, (focusHeadY - myHeadY) / 260));
    }
    // the focus looks at their interaction partner, if any
    if (beatTiming?.targetCharacterId) {
      const tv = byId.get(castIdOf(shot, beatTiming.targetCharacterId));
      if (tv && tv !== focusV) {
        focusV.gazeDx = Math.max(-1, Math.min(1, (tv.x - focusV.x) / 340));
      }
    }
  }

  // --- side/back-facing characters commit their eyes to the turn ---
  for (const v of visuals) {
    if (v.facing === 'left' || v.facing === 'right') {
      v.gazeDx = (v.gazeDx ?? 0) * 0.22;
      v.gazeDy = (v.gazeDy ?? 0) * 0.5;
    } else if (v.facing === 'back') {
      v.gazeDx = 0;
      v.gazeDy = 0;
    }
  }

  // --- living idle: breathing + micro-sway (composites over actions)
  if (shot.kind !== 'title') {
    for (const v of visuals) {
      if (!v.visible) continue;
      const ph = hash01(v.castId) * Math.PI * 2;
      const br = Math.sin(t * 0.00196 + ph);
      const ch = characters[v.characterId];
      const amp = isAnimal(ch) ? 1.1 : 1.8;
      v.footY -= br * amp;
      v.scaleY = (v.scaleY ?? 1) + br * 0.005;
      v.scaleX = (v.scaleX ?? 1) - br * 0.003;
      v.rotation = (v.rotation ?? 0) + br * 0.003;
    }
  }

  // --- camera + transition
  const transitionProgress = shotTiming.transitionMs === 0
    ? 1
    : Math.min(1, (t - shotTiming.startMs) / shotTiming.transitionMs);
  const cameraProgress = Math.min(1, (t - shotTiming.startMs) / 8000);

  return {
    shot,
    characters,
    visuals,
    speakingCharacterId,
    talkOpen,
    beatText,
    beatCharacterId,
    cameraProgress,
    transitionProgress,
    tMs: t,
    fx,
  };
}

function castIdOf(shot: Shot, characterId: string): string {
  const entry = shot.cast.find((c) => c.characterId === characterId);
  return entry?.id ?? "";
}

/** How the partner behaves right after an interaction (during the walk-back) */
function partnerReaction(target: CastVisual, action: BeatAction, q: number): void {
  switch (action) {
    case 'highfive':
      target.pose = q < 0.55 ? 'cheer' : 'idle';
      if (q < 0.55) target.footY -= Math.abs(Math.sin(q * Math.PI * 2)) * 6;
      break;
    case 'hug':
      target.pose = q < 0.4 ? 'hug' : 'idle';
      break;
    case 'give':
      target.pose = q < 0.5 ? 'cheer' : 'idle';
      break;
    case 'whisper': {
      // shock → hand-to-mouth giggle with a little bounce
      target.pose = q < 0.3 ? 'shock' : q < 0.62 ? 'clap' : 'idle';
      if (q >= 0.3 && q < 0.62) target.footY -= Math.abs(Math.sin(q * Math.PI * 5)) * 4;
      break;
    }
    default:
      break;
  }
}

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

const GAP = 170; // how close interaction partners stand

function applyAction(
  action: BeatAction,
  actor: CastVisual | undefined,
  actorCh: Character | undefined,
  target: CastVisual | undefined,
  targetCh: Character | undefined,
  p: number,
  elapsedMs: number,
  fx: FxInstance[],
  durMs = 1000
): void {
  if (actor) actor.pose = POSE_FOR_ACTION[action] ?? 'idle';
  if (target && INTERACTION_ACTIONS.has(action)) {
    target.pose =
      action === 'pet' ? 'idle' : action === 'fetch' ? 'idle' : (POSE_FOR_ACTION[action] ?? 'idle');
    if (isAnimal(targetCh)) target.pose = undefined;
  }
  if (isAnimal(actorCh)) {
    if (actor) {
      actor.animalVariant = variantForAction(action);
      if (action !== 'run' && action !== 'fetch' && action !== 'wag') {
        // vocal variants revert to idle after the call
        if (p > 0.75) actor.animalVariant = 'idle';
      }
    }
  }
  if (isAnimal(targetCh) && target) {
    const v =
      action === 'fetch'
        ? p > 0.28 && p < 0.58
          ? 'run'
          : 'idle'
        : action === 'pet'
          ? p > 0.35
            ? 'wag'
            : 'idle'
          : 'idle';
    target.animalVariant = v as AnimalVariant;
  }

  // --- two-actor interactions: natural 3-phase choreography
  // (walk over with real steps → contact with mutual motion → walk back + partner reaction)
  if (INTERACTION_ACTIONS.has(action) && actor && target && actorCh && !isAnimal(actorCh)) {
    const homeX = actor.homeX ?? 300;
    const dir = target.x >= homeX ? 1 : -1;
    const targetHome = target.homeX ?? target.x;
    const partnerStep = action === 'hug' || action === 'highfive' ? 16 : 0;
    const gap = STAND_OFF[action] ?? GAP;
    const stopX = targetHome + partnerStep - dir * (gap + (isAnimal(targetCh) ? 60 : 0));
    // keep the speech bubble clear of the interaction partner while up close
    if (actor) actor.bubbleDx = -dir * 150;
    // travel windows follow the DISTANCE at a natural walking speed (~500 px/s),
    // clamped so contact still gets a fair share of the beat
    const dist = Math.abs(stopX - homeX);
    const naturalMs = dist / 0.5; // px per ms
    const approachFrac = Math.min(0.46, Math.max(0.2, naturalMs / Math.max(1, durMs)));
    if (p < approachFrac) {
      // stride-synced approach: accelerate out of standstill, pull up at the partner
      const w = walkTravel(homeX, stopX, elapsedMs, durMs * approachFrac, {});
      actor.x = w.x;
      // raise the acting arm in the final moments (anticipation beat)
      actor.pose =
        p > approachFrac * 0.86 ? (POSE_FOR_ACTION[action] ?? 'idle') : w.pose;
      actor.footY -= w.lift;
      actor.lean = p > approachFrac * 0.86 ? dir * 0.02 : w.lean;
      actor.rotation = (actor.rotation ?? 0) + w.sway;
      // the partner shifts weight to meet the actor halfway
      if (partnerStep > 0 && !isAnimal(targetCh)) {
        const te = easeInOutSine(Math.max(0, Math.min(1, (p / approachFrac - 0.45) / 0.55)));
        target.x = targetHome - dir * partnerStep * te;
      }
    } else if (p > TRAVEL_OUT) {
      // stride-synced walk back home (a touch brisker than the approach)
      const returnFrac = Math.min(0.34, Math.max(0.18, (naturalMs * 0.85) / Math.max(1, durMs)));
      const backMs = durMs * returnFrac;
      const w = walkTravel(stopX, homeX, elapsedMs - durMs * (1 - returnFrac), backMs, {});
      actor.x = w.x;
      actor.pose = w.pose;
      actor.footY -= w.lift;
      actor.lean = w.lean;
      actor.rotation = (actor.rotation ?? 0) + w.sway;
      if (target && !isAnimal(targetCh)) {
        // partner steps back home and reacts to what just happened
        const q = (p - (1 - returnFrac)) / returnFrac;
        target.x = targetHome - dir * partnerStep * (1 - easeOutCubic(q));
        partnerReaction(target, action, q);
      }
    } else {
      // standing at the partner — contact micro-motion
      actor.x = stopX;
      const act = (p - approachFrac) / (TRAVEL_OUT - approachFrac);
      switch (action) {
        case 'hug': {
          const sway = Math.sin(act * Math.PI * 2);
          const reach = Math.min(1, act * 3); // arms close in during the first instants
          actor.lean = dir * (0.05 + 0.018 * reach) + sway * 0.012;
          if (target) {
            target.lean = -dir * (0.05 + 0.018 * reach) - sway * 0.012;
            target.footY -= Math.abs(Math.sin(act * Math.PI * 2)) * 1.6; // shared little bounce
          }
          break;
        }
        case 'highfive': {
          actor.lean = dir * 0.02;
          const pulse = Math.exp(-Math.pow((p - 0.52) * 14, 2)); // impact recoil
          if (target) {
            target.scaleX = (target.scaleX ?? 1) + pulse * 0.045;
            target.scaleY = (target.scaleY ?? 1) - pulse * 0.035;
            target.lean = -dir * pulse * 0.07;
          }
          break;
        }
        case 'whisper': {
          const leanIn = Math.sin(act * Math.PI);
          actor.lean = dir * (0.03 + leanIn * 0.1);
          if (target) target.lean = -dir * (0.02 + 0.02 * leanIn); // ear tilts toward the secret
          break;
        }
        case 'pet': {
          const stroke = Math.sin(act * Math.PI * 3);
          actor.footY -= Math.max(0, stroke) * 2.6; // 3 gentle strokes
          break;
        }
        case 'give': {
          const offer = Math.sin(Math.min(1, act * 1.4) * Math.PI);
          actor.lean = dir * (0.015 + offer * 0.02);
          break;
        }
        default:
          actor.lean = dir * 0.015;
          break;
      }
    }
    if (action === 'fetch' && targetCh && isAnimal(targetCh) && target) {
      // dog dashes after the ball with real running steps, plants, turns, dashes back
      const home = target.homeX ?? target.x;
      const away = home + dir * 240;
      const runMs = Math.max(300, 240 / 0.85); // ≈850 px/s dash
      const outFrac = Math.min(0.16, runMs / Math.max(1, durMs));
      const outStart = 0.3;
      const outEnd = outStart + outFrac;
      const backStart = outEnd + 0.06; // plant + turn-around moment
      const backEnd = backStart + outFrac * 1.1;
      if (p >= outStart && p < outEnd) {
        const w = walkTravel(home, away, ((p - outStart) / (outEnd - outStart)) * runMs, runMs, { run: true, stop: false });
        target.x = w.x;
        target.footY -= w.lift;
      } else if (p >= backStart && p < backEnd) {
        const w = walkTravel(away, home, ((p - backStart) / (backEnd - backStart)) * runMs * 1.1, runMs * 1.1, { run: true });
        target.x = w.x;
        target.footY -= w.lift;
      } else {
        target.x = p >= outEnd && p < backStart ? away : home;
      }
    }
  }

  // --- exit: turn the back first, then walk off into the distance
  // (stride-synced steps, recede + shrink), gone
  if (action === 'exit' && actor) {
    const home = actor.homeX ?? 300;
    const dir = home < 640 ? -1 : 1;
    const walkP = Math.max(0, (p - 0.45) / 0.55); // walk only after the pivot lands
    const w = walkTravel(home, home + dir * 700, walkP * 1100, 1100, { cruise: true, stop: false });
    actor.x = w.x;
    actor.pose = w.pose;
    actor.footY -= w.lift + 34 * walkP;
    actor.lean = w.lean;
    const depth = 1 - 0.12 * walkP;
    actor.scaleX = (actor.scaleX ?? 1) * depth;
    actor.scaleY = (actor.scaleY ?? 1) * depth;
    if (p > 0.94) actor.visible = false;
  }

  // one-actor motions
  if (!actor) return;
  const b = { x: actor.homeX ?? actor.x, footY: actor.homeFootY ?? actor.footY };
  switch (action) {
    case 'wave':
      actor.rotation = Math.sin(p * Math.PI * 6) * 0.07;
      break;
    case 'jump': {
      // anticipation squash → stretch up → land squash → settle
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 2)) * 46;
      if (p < 0.12) {
        const k = p / 0.12;
        actor.scaleX = 1 + 0.05 * k;
        actor.scaleY = 1 - 0.06 * k;
      } else if (p < 0.5) {
        const k = (p - 0.12) / 0.38;
        actor.scaleX = 1.05 - 0.1 * k;
        actor.scaleY = 0.94 + 0.13 * k;
      } else if (p < 0.62) {
        actor.scaleX = 0.95;
        actor.scaleY = 1.07;
      } else if (p < 0.78) {
        const k = (p - 0.62) / 0.16;
        actor.scaleX = 0.95 + 0.1 * k;
        actor.scaleY = 1.07 - 0.12 * k;
      } else {
        const k = (p - 0.78) / 0.22;
        actor.scaleX = 1.05 - 0.05 * k;
        actor.scaleY = 0.95 + 0.05 * k;
      }
      break;
    }
    case 'nod':
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 3)) * 9;
      actor.rotation = Math.sin(p * Math.PI * 3) * 0.03;
      break;
    case 'shake':
      actor.x = b.x + Math.sin(p * Math.PI * 9) * 9 * (1 - p * 0.4);
      break;
    case 'dance':
      actor.rotation = Math.sin(p * Math.PI * 8) * 0.1;
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 8)) * 12;
      actor.x = b.x + Math.sin(p * Math.PI * 4) * 16;
      break;
    case 'run':
      actor.pose = stridePose(elapsedMs, 112);
      actor.footY = b.footY - Math.abs(Math.sin((elapsedMs / 112) * Math.PI)) * 9;
      actor.lean = 0.07;
      break;
    case 'sneak':
      actor.rotation = 0.05;
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 6)) * 4;
      break;
    case 'laugh':
      actor.rotation = Math.sin(p * Math.PI * 7) * 0.05;
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 7)) * 6;
      break;
    case 'cry':
      actor.rotation = Math.sin(p * Math.PI * 4) * 0.03 - 0.02;
      break;
    case 'sulk':
      actor.rotation = -0.04;
      break;
    case 'gasp':
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI)) * 12;
      break;
    case 'sit':
      actor.footY = b.footY + 26 * Math.min(1, p * 3);
      break;
    case 'fetch':
      actor.rotation = Math.sin(p * Math.PI * 2) * 0.08;
      break;
    case 'pet':
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 2)) * 3;
      break;
    default:
      break;
  }

  spawnActionFx(action, actor, actorCh, target, targetCh, p, fx);
}

function spawnActionFx(
  action: BeatAction,
  actor: CastVisual,
  actorCh: Character | undefined,
  target: CastVisual | undefined,
  targetCh: Character | undefined,
  p: number,
  fx: FxInstance[]
): void {
  const head = (v?: CastVisual, ch?: Character) => {
    if (!v || !ch) return { x: v?.x ?? 640, y: (v?.footY ?? 640) - (v?.drawH ?? 440) * 0.9 };
    const scale = v.drawH / 768;
    return { x: v.x, y: v.footY - v.drawH + 96 * scale };
  };
  const ah = head(actor, actorCh);
  const th = head(target, targetCh);

  const push = (kind: FxKind, x: number, y: number) => fx.push({ kind, x, y, p });

  switch (action) {
    case 'think':
      if (p > 0.15) push('question', ah.x + 60, ah.y - 20);
      break;
    case 'cheer':
    case 'jump':
      if (p > 0.2) push('sparkles', ah.x, ah.y - 30);
      if (action === 'jump' && p > 0.62 && p < 0.9) push('dust', actor.x, actor.footY - 4);
      break;
    case 'clap':
      if (p > 0.25 && Math.floor(p * 6) % 2 === 0) push('sparkles', ah.x, ah.y + 60);
      break;
    case 'laugh':
      push('notes', ah.x + 50, ah.y - 10);
      break;
    case 'cry':
      push('tears', ah.x, ah.y + 20);
      break;
    case 'gasp':
      push('exclaim', ah.x + 46, ah.y - 26);
      break;
    case 'dance':
      push('notes', ah.x + 54, ah.y - 24);
      break;
    case 'run':
      push('dust', actor.x - 30, actor.footY - 6);
      break;
    case 'sneak':
      if (p < 0.7) push('dots', ah.x + 44, ah.y + 6);
      break;
    case 'hug':
      if (p > 0.34 && p < 0.7) push('hearts', (ah.x + th.x) / 2, Math.min(ah.y, th.y) - 10);
      break;
    case 'highfive':
      if (p > 0.46 && p < 0.62) push('sparkles', (ah.x + th.x) / 2, Math.min(ah.y, th.y) + 40);
      break;
    case 'give': {
      if (p > 0.36 && p < 0.68) {
        const gp = Math.max(0, Math.min(1, (p - 0.36) / 0.28));
        fx.push({
          kind: 'gift',
          x: ah.x + (th.x > ah.x ? 26 : -26),
          y: Math.max(ah.y, th.y) + 150,
          p: gp,
          toX: th.x,
          toY: Math.max(ah.y, th.y) + 150,
        });
      }
      break;
    }
    case 'whisper':
      if (p > 0.3 && p < 0.75) push('dots', ah.x + (th.x > ah.x ? 40 : -40), ah.y + 8);
      break;
    case 'pet':
      if (p > 0.3 && p < 0.8) push('hearts', th.x, th.y - 6);
      break;
    case 'fetch':
      if (p > 0.08 && p < 0.4) {
        const bp = (p - 0.08) / 0.32;
        fx.push({ kind: 'ball', x: ah.x, y: ah.y + 80, p: bp, toX: target ? target.homeX : ah.x + 240, toY: (target?.homeFootY ?? 640) - 80 });
      }
      break;
    case 'bark':
      push('exclaim', th.x + (target ? 40 : 40), th.y);
      break;
    case 'meow':
    case 'chirp':
      push('notes', (target ? th.x : ah.x) + 44, (target ? th.y : ah.y));
      break;
    case 'wag':
      if (actorCh && isAnimal(actorCh)) push('waglines', actor.x - (actor.flip ? -70 : 70), actor.footY - 90);
      break;
    default:
      break;
  }
  void actorCh;
}

/** Positions for cast members (used by editors) */
export function positionX(p: Position): number {
  return POSITION_X[p];
}

export function restingCast(entry: CastEntry, ch?: Character): CastVisual {
  return restingVisual(entry, ch);
}
