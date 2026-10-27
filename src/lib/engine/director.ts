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
import type { CastVisual, FrameState, FxInstance, FxKind } from './renderer';
import { POSITION_X, drawHFor, restingVisual } from './renderer';

// ---------------------------------------------------------------------------
// Director: pure, deterministic timeline simulation.
// The same code drives in-browser playback and the offline video renderer,
// so both produce identical, audio-synced animation.
// ---------------------------------------------------------------------------

export const TRANSITION_MS = 620;
export const ENTER_MS: Record<string, number> = {
  none: 0,
  fade: 550,
  walkLeft: 1100,
  walkRight: 1100,
  runLeft: 700,
  runRight: 700,
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
const APPROACH_MS = 620;
const RETURN_MS = 560;

export function actionDuration(a: BeatAction): number {
  return ACTION_MS[a] ?? 0;
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
    const v = restingVisual(entry);
    const ch = characters[entry.characterId];
    v.drawH = drawHFor(entry.position, isAnimal(ch));
    v.flip = entry.position === 'right';
    return v;
  });
  const byId = new Map(visuals.map((v) => [v.castId, v]));

  // --- entrances
  for (const entry of shot.cast) {
    const enterMs = ENTER_MS[entry.enter] ?? 0;
    if (enterMs <= 0) continue;
    const since = t - shotTiming.startMs;
    const p = Math.min(1, since / enterMs);
    const v = byId.get(entry.id);
    if (!v) continue;
    const e = easeOutCubic(p);
    if (entry.enter === 'fade') {
      v.alpha = e;
    } else {
      const dir = entry.enter === 'walkLeft' || entry.enter === 'runLeft' ? -1 : 1;
      const from = dir < 0 ? -240 : 1520;
      v.x = v.x + (from - v.x) * (1 - e);
      const freq = entry.enter.startsWith('run') ? 7 : 5;
      v.footY -= Math.abs(Math.sin(p * Math.PI * freq)) * 7;
      if (entry.enter.startsWith('run')) {
        v.x = v.x + (dir < 0 ? 60 : -60) * Math.sin(p * Math.PI); // burst
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
      const p = Math.min(1, (t - beatTiming.startMs) / Math.max(1, beatTiming.endMs - beatTiming.startMs));
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

      applyAction(beat.action, actor, actorCh, target, targetCh, p, fx);

      if (beat.text) {
        beatText = beat.text;
        beatCharacterId = beat.characterId;
        const audioStart = beatTiming.startMs + 60;
        if (t >= audioStart && t < audioStart + beatTiming.audioDurMs + 120) {
          speakingCharacterId = beat.characterId;
          const at = (t - audioStart) / 1000;
          talkOpen = 0.25 + 0.75 * Math.abs(Math.sin(at * 11.3) * (0.65 + 0.35 * Math.sin(at * 2.6)));
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

  // --- fx from speaking/target state (spawned continuously by applyAction above)

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
    fx,
  };
}

function castIdOf(shot: Shot, characterId: string): string {
  const entry = shot.cast.find((c) => c.characterId === characterId);
  return entry?.id ?? "";
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
  fx: FxInstance[]
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
      action === 'fetch' ? (p > 0.25 ? 'run' : 'idle') : action === 'pet' ? (p > 0.35 ? 'wag' : 'idle') : 'idle';
    target.animalVariant = v as AnimalVariant;
  }

  // travel for two-actor interactions
  if (INTERACTION_ACTIONS.has(action) && actor && target && actorCh && !isAnimal(actorCh)) {
    const homeX = actor.homeX ?? 300;
    const phase = p < 0.28 ? p / 0.28 : p > 0.74 ? 1 - (p - 0.74) / 0.26 : 1;
    const e = easeOutCubic(Math.max(0, Math.min(1, phase)));
    const dir = target.x > homeX ? 1 : -1;
    const stopX = target.x - dir * (GAP + (isAnimal(targetCh) ? 60 : 0));
    actor.x = homeX + (stopX - homeX) * e;
    actor.footY -= Math.abs(Math.sin(e * Math.PI * 4)) * 5; // steps
    if (action === 'fetch' && targetCh && isAnimal(targetCh)) {
      // dog dashes toward the ball and back
      const dp = p < 0.3 ? 0 : p < 0.62 ? (p - 0.3) / 0.32 : p < 0.8 ? 1 - (p - 0.62) / 0.18 : 0;
      const away = dir * 240;
      target.x = (target.homeX ?? target.x) + away * dp;
      target.footY -= Math.abs(Math.sin(dp * Math.PI * 6)) * 6;
    }
  }

  // one-actor motions (mirror the classic player)
  if (!actor) return;
  const b = { x: actor.homeX ?? actor.x, footY: actor.homeFootY ?? actor.footY };
  switch (action) {
    case 'wave':
      actor.rotation = Math.sin(p * Math.PI * 6) * 0.07;
      break;
    case 'jump':
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 2)) * 46;
      break;
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
      actor.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 10)) * 9;
      actor.rotation = 0.06;
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
      actor.footY = b.footY + 26 * Math.min(1, p * 3) * (1 - Math.max(0, (p - 0.85) / 0.15) * 0.0);
      break;
    case 'fetch':
      actor.rotation = Math.sin(p * Math.PI * 2) * 0.08;
      break;
    case 'pet':
      // crouch handled by pose; slight bob
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
      if (p > 0.32 && p < 0.72) push('hearts', (ah.x + th.x) / 2, Math.min(ah.y, th.y) - 10);
      break;
    case 'highfive':
      if (p > 0.4 && p < 0.6) push('sparkles', (ah.x + th.x) / 2, Math.min(ah.y, th.y) + 40);
      break;
    case 'give':
      if (p > 0.38 && p < 0.66) push('sparkles', (ah.x + th.x) / 2, Math.max(ah.y, th.y) + 90);
      break;
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

export function restingCast(entry: CastEntry): CastVisual {
  return restingVisual(entry);
}
