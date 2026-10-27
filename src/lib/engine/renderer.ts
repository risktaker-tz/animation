import type { CastEntry, Character, Emotion, Position, Shot } from '@/lib/types';
import { isAnimal } from '@/lib/types';
import { lookKey, SPRITE_W, DRAW_H, faceAnchor, type Pose } from '@/lib/character-svg';
import { buildAnimalSvg, animalKey, ANIMAL_DRAW_H, ANIMAL_SPRITE_H, type AnimalVariant } from '@/lib/animals';
import { drawFace, blinkOpenAt } from '@/lib/emotions';
import { bgKey, getCachedImage } from '@/lib/engine/images';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const FOOT_Y = 640;

export const POSITION_X: Record<Position, number> = {
  left: 300,
  center: 640,
  right: 980,
};

/** Which way a character is oriented on stage */
export type Facing = 'front' | 'left' | 'right' | 'back';

/** Body scale for each facing (negative = mirrored). 'back' pivots fully around. */
const FACING_SCALE: Record<Facing, number> = {
  front: 1,
  right: 0.94,
  left: -0.94,
  back: -1,
};

function easeSine(k: number): number {
  const c = Math.max(0, Math.min(1, k));
  return -(Math.cos(Math.PI * c) - 1) / 2;
}

function easeOutCubic(k: number): number {
  const c = Math.max(0, Math.min(1, k));
  return 1 - Math.pow(1 - c, 3);
}

/**
 * One staged cartoon pivot, driven by progress k (0..1):
 *   1. anticipation — the body counter-rotates AWAY from the turn before committing;
 *   2. pivot — the width follows the angle being turned through: a quarter turn
 *      (front↔side) merely narrows, while a real about-face (side↔side or any↔back)
 *      whips through a thin edge-on moment; knees bend (weight dip) mid-turn;
 *   3. settle — a tiny recoil back into stance.
 * This reads as a person turning on the spot instead of a flat cutout rotating.
 */
function stagedTurn(
  from: number,
  to: number,
  kRaw: number
): { scale: number; dip: number; rot: number } {
  const k = Math.max(0, Math.min(1, kRaw));
  const settled = { scale: to, dip: 0, rot: 0 };
  if (from === to || k >= 1) return settled;
  const signFrom = Math.sign(from) || 1;
  const signTo = Math.sign(to) || 1;
  const wFrom = Math.abs(from);
  const wTo = Math.abs(to);

  // how deep the body narrows mid-pivot, by angle turned:
  // quarter turn (front↔side) barely narrows · about-face whips to a sliver
  const crossing = signFrom !== signTo;
  const toBack = to < 0 && wTo >= 0.99;
  const fromBack = from < 0 && wFrom >= 0.99;
  const bothSides = wFrom < 0.99 && wTo < 0.99;
  const depth = toBack || fromBack ? 0.93 : bothSides ? 0.9 : 0.24;

  const eased = easeSine(k);
  let width = wFrom + (wTo - wFrom) * eased;
  width *= 1 - depth * Math.sin(Math.PI * k);
  width = Math.max(0.085, width);

  // the mirror flips at the visual midpoint of the swing
  const scale = (k < 0.5 ? signFrom : signTo) * width;

  // weight dip while pivoting (knees bend through the middle of the turn)
  const dip = Math.sin(Math.PI * Math.max(0, Math.min(1, (k - 0.14) / 0.72)));

  // counter-lean during anticipation + tiny recoil on settle
  const dirSign = signTo >= signFrom ? 1 : -1;
  const antic = k < 0.24 ? Math.sin((k / 0.24) * Math.PI) : 0;
  const recoil = k > 0.78 ? Math.sin(((k - 0.78) / 0.22) * Math.PI) : 0;
  const rot = -dirSign * 0.045 * antic + dirSign * 0.014 * recoil;

  return { scale, dip, rot };
}

export interface TurnDynamics {
  /** horizontal body scale at this instant (signed) */
  bodyScale: number;
  /** 3/4 head-turn amount 0 (front) .. 1 (profile) */
  yaw: number;
  /** face overlay opacity 0..1 (fades at edge-on / hidden behind) */
  faceVis: number;
  /** weight dip in px (applied as a squash toward the feet) */
  dipPx: number;
  /** extra body rotation in radians from the pivot choreography */
  rot: number;
  /** true when the back-view sprite should be shown */
  useBack: boolean;
}

const sideOf = (f: Facing) => (f === 'left' || f === 'right' ? 1 : 0);

/** Full turn choreography for a cast visual at its current turnK. */
export function turnDynamics(v: CastVisual): TurnDynamics {
  const facing = v.facing ?? 'front';
  const facingFrom = v.facingFrom ?? facing;
  const to = FACING_SCALE[facing];
  const from = FACING_SCALE[facingFrom];
  const { scale, dip, rot } = stagedTurn(from, to, v.turnK ?? 1);
  const bodyScale = scale;

  // the head arrives before the shoulders finish — people look first, then turn
  const yawK = easeOutCubic(Math.max(0, Math.min(1, ((v.turnK ?? 1) - 0.04) / 0.55)));
  const yaw = sideOf(facingFrom) + (sideOf(facing) - sideOf(facingFrom)) * yawK;

  // face handling by turn type:
  //  · quarter turns keep the face (dimmed at the mirror flip, yaw sells the look)
  //  · about-faces fade through the edge-on moment
  const crossing = Math.sign(from) !== Math.sign(to);
  const toBack = facing === 'back';
  const fromBack = facingFrom === 'back';
  let faceVis: number;
  if (toBack || fromBack) {
    faceVis = Math.max(0, Math.min(1, (Math.abs(bodyScale) - 0.34) / 0.22));
    if (toBack && (v.turnK ?? 1) >= 0.999) faceVis = 0;
  } else if (crossing) {
    faceVis = 1 - 0.6 * Math.sin(Math.PI * Math.min(1, v.turnK ?? 1));
  } else {
    faceVis = 1;
  }

  // sprite swaps at the visual midpoint of the swing (respects the ease curve)
  const useBack = toBack ? (v.turnK ?? 1) >= 0.5 : fromBack ? (v.turnK ?? 1) < 0.5 : false;

  return { bodyScale, yaw, faceVis, dipPx: dip * 4.2, rot, useBack };
}

/**
 * Staged flip for side-view animal sprites (front/back views don't exist).
 * Returns the signed horizontal scale — passes through a thin edge-on sliver
 * instead of popping from one side to the other.
 */
export function animalTurnScale(v: CastVisual): number {
  const to = v.facing === 'left' ? -1 : v.facing === 'right' ? 1 : v.flip ? -1 : 1;
  const from =
    v.facingFrom === 'left' ? -1 : v.facingFrom === 'right' ? 1 : to;
  const { scale } = stagedTurn(from, to, v.turnK ?? 1);
  // keep a minimum sliver so the sprite never collapses to nothing
  return Math.sign(scale) * Math.max(0.14, Math.abs(scale));
}

export type FxKind =
  | 'hearts'
  | 'sparkles'
  | 'notes'
  | 'tears'
  | 'exclaim'
  | 'question'
  | 'dust'
  | 'dots'
  | 'waglines'
  | 'ball'
  | 'gift';

export interface FxInstance {
  kind: FxKind;
  x: number;
  y: number;
  /** 0..1 progress within the action (deterministic) */
  p: number;
  toX?: number;
  toY?: number;
}

export interface CastVisual {
  castId: string;
  characterId: string;
  position: Position;
  emotion: Emotion;
  x: number;
  footY: number;
  drawH: number;
  alpha: number;
  rotation: number;
  visible: boolean;
  /** current arm/body pose (humans) */
  pose?: Pose;
  /** sprite variant (animals) */
  animalVariant?: AnimalVariant;
  /** mirror horizontally (animals facing center) */
  flip?: boolean;
  /** home position for action math */
  homeX?: number;
  homeFootY?: number;
  /** squash & stretch (1 = neutral), applied about the feet */
  scaleX?: number;
  scaleY?: number;
  /** extra lean rotation (radians), e.g. walking lean-in */
  lean?: number;
  /** gaze offset toward a point of interest, in head-radius units */
  gazeDx?: number;
  gazeDy?: number;
  /** orientation on stage (humans) — resolved by the director */
  facing?: Facing;
  /** previous facing while pivoting (for the turn-around animation) */
  facingFrom?: Facing;
  /** 0..1 progress of the current pivot (1 = settled) */
  turnK?: number;
  /** horizontal bias for the speech bubble (keeps it off the interaction partner) */
  bubbleDx?: number;
}

export interface FrameState {
  shot: Shot;
  characters: Record<string, Character>;
  visuals: CastVisual[];
  /** character currently talking (drives lip-sync + bubble) */
  speakingCharacterId: string | null;
  talkOpen: number;
  /** text of the active beat (bubble + subtitle) */
  beatText: string | null;
  beatCharacterId: string | null;
  /** 0..1 within-shot progress (zoom camera) */
  cameraProgress: number;
  /** 0..1 transition progress (1 = fully settled) */
  transitionProgress: number;
  /** absolute timeline time (blinks, breathing phase) */
  tMs: number;
  /** deterministic interaction effects */
  fx?: FxInstance[];
}

export function drawHFor(position: Position, animal = false, age?: 'adult' | 'child'): number {
  if (animal) return 0;
  const base = position === 'center' ? DRAW_H + 14 : DRAW_H - 8;
  return age === 'child' ? Math.round(base * 0.74) : base;
}

export function animalDrawH(ch: Character, position: Position): number {
  const species = ch.species ?? 'dog';
  const base = ANIMAL_DRAW_H[species];
  return position === 'center' ? base * 1.06 : base;
}

export function restingVisual(entry: CastEntry, ch?: Character): CastVisual {
  const child = ch?.kind !== 'animal' && ch?.look.age === 'child';
  const baseH = DRAW_H - (entry.position === 'center' ? 0 : 8) + (entry.position === 'center' ? 14 : 0);
  return {
    castId: entry.id,
    characterId: entry.characterId,
    position: entry.position,
    emotion: entry.emotion,
    x: POSITION_X[entry.position],
    footY: FOOT_Y,
    drawH: child ? Math.round(baseH * 0.74) : baseH,
    alpha: 1,
    rotation: 0,
    visible: true,
    pose: 'idle',
    homeX: POSITION_X[entry.position],
    homeFootY: FOOT_Y,
    scaleX: 1,
    scaleY: 1,
  };
}

export function restingVisuals(shot: Shot, characters?: Record<string, Character>): CastVisual[] {
  return shot.cast.map((e) => restingVisual(e, characters?.[e.characterId]));
}

// ---------------------------------------------------------------- helpers

let CACHED_FONT_FAMILY: string | null = null;

function fontFamily(): string {
  if (CACHED_FONT_FAMILY) return CACHED_FONT_FAMILY;
  if (typeof document !== 'undefined') {
    CACHED_FONT_FAMILY = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  } else {
    CACHED_FONT_FAMILY = 'system-ui, sans-serif';
  }
  return CACHED_FONT_FAMILY;
}

function canvasFont(weight: number | string, size: number): string {
  return `${weight} ${size}px ${fontFamily()}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const attempt = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth || !cur) {
      cur = attempt;
    } else {
      lines.push(cur);
      cur = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxWidth && last.includes(' ')) {
        last = last.slice(0, last.lastIndexOf(' '));
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headTopY: number,
  speakerName: string,
  text: string,
  biasDx = 0
): void {
  ctx.save();
  ctx.font = canvasFont(500, 26);
  const maxTextW = 360;
  const lines = wrapText(ctx, text, maxTextW, 4);
  const lineH = 34;
  const padX = 22;
  const nameH = 34;
  const bw = Math.min(
    400,
    Math.max(...lines.map((l) => ctx.measureText(l).width)) + padX * 2
  );
  const bh = nameH + lines.length * lineH + 20;
  let bx = headX + biasDx - bw / 2;
  bx = Math.max(14, Math.min(CANVAS_W - bw - 14, bx));
  let by = headTopY - bh - 26;
  if (by < 14) by = 14;

  ctx.fillStyle = '#FDFCF9';
  ctx.strokeStyle = '#8E5AC8';
  ctx.lineWidth = 3.5;
  const tailX = Math.max(bx + 26, Math.min(bx + bw - 26, headX));
  ctx.beginPath();
  ctx.moveTo(tailX - 16, by + bh - 2);
  ctx.lineTo(tailX, by + bh + 22);
  ctx.lineTo(tailX + 16, by + bh - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  roundRect(ctx, bx, by, bw, bh, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8E5AC8';
  ctx.font = canvasFont(700, 21);
  ctx.fillText(speakerName.toUpperCase(), bx + padX, by + 26);

  ctx.fillStyle = '#221B2E';
  ctx.font = canvasFont(500, 26);
  lines.forEach((l, i) => {
    ctx.fillText(l, bx + padX, by + nameH + 10 + i * lineH);
  });
  ctx.restore();
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string): void {
  ctx.save();
  ctx.font = canvasFont(500, 30);
  const lines = wrapText(ctx, text, CANVAS_W - 220, 2);
  const lineH = 38;
  const barH = lines.length * lineH + 26;
  const y = CANVAS_H - barH - 18;
  ctx.fillStyle = 'rgba(12,10,20,0.72)';
  roundRect(ctx, 70, y, CANVAS_W - 140, barH, 14);
  ctx.fill();
  ctx.fillStyle = '#F5F1FF';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => {
    ctx.fillText(l, CANVAS_W / 2, y + 34 + i * lineH);
  });
  ctx.restore();
}

function placeholderSprite(ctx: CanvasRenderingContext2D, drawH: number): void {
  const w = SPRITE_W * (drawH / 768);
  ctx.fillStyle = '#3A3548';
  roundRect(ctx, -w / 2 + w * 0.18, -drawH, w * 0.64, drawH, w * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -drawH + drawH * 0.2, drawH * 0.11, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- fx

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-10, -6, -4, -14, 0, -7);
  ctx.bezierCurveTo(4, -14, 10, -6, 0, 4);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = (i / 8) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFx(ctx: CanvasRenderingContext2D, fx: FxInstance): void {
  const p = Math.max(0, Math.min(1, fx.p));
  ctx.save();
  switch (fx.kind) {
    case 'hearts': {
      for (let i = 0; i < 3; i++) {
        const q = Math.min(1, Math.max(0, p * 1.4 - i * 0.16));
        drawHeart(ctx, fx.x + (i - 1) * 26 + Math.sin(q * 7 + i) * 6, fx.y - q * 60 - i * 8, 0.9 + i * 0.16, `rgba(232,120,140,${1 - q})`);
      }
      break;
    }
    case 'sparkles': {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + p * 2;
        const r = 14 + p * 44;
        drawStar(ctx, fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r * 0.7, 5 * (1 - p) + 2, `rgba(244,214,120,${1 - p})`);
      }
      break;
    }
    case 'notes': {
      for (let i = 0; i < 2; i++) {
        const q = Math.min(1, Math.max(0, p * 1.3 - i * 0.2));
        ctx.fillStyle = `rgba(200,214,244,${1 - q})`;
        ctx.font = `${22 + i * 5}px system-ui, sans-serif`;
        ctx.fillText(i % 2 === 0 ? '♪' : '♫', fx.x + i * 22 + Math.sin(q * 6) * 5, fx.y - q * 54);
      }
      break;
    }
    case 'tears': {
      for (const side of [-1, 1]) {
        const q = Math.min(1, p * 1.2);
        ctx.fillStyle = `rgba(140,190,240,${0.85 * (1 - q * 0.6)})`;
        ctx.beginPath();
        ctx.ellipse(fx.x + side * 20, fx.y + 10 + q * 46, 4.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'exclaim': {
      const bounce = Math.sin(p * Math.PI * 4) * 6;
      ctx.fillStyle = `rgba(240,210,110,${1 - p * 0.35})`;
      ctx.font = '800 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', fx.x, fx.y - 10 + bounce);
      break;
    }
    case 'question': {
      const drift = Math.sin(p * Math.PI * 2) * 4;
      ctx.fillStyle = `rgba(200,214,244,${1 - p * 0.4})`;
      ctx.font = '700 38px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', fx.x + drift, fx.y - p * 18);
      break;
    }
    case 'dust': {
      for (let i = 0; i < 4; i++) {
        const q = (p * 2 + i * 0.25) % 1;
        ctx.fillStyle = `rgba(210,205,195,${0.5 * (1 - q)})`;
        ctx.beginPath();
        ctx.arc(fx.x - i * 22, fx.y - q * 16, 7 - q * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'dots': {
      ctx.fillStyle = `rgba(226,222,212,${0.9 - p * 0.5})`;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(fx.x + i * 14, fx.y - Math.sin(p * 6 + i) * 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'waglines': {
      ctx.strokeStyle = `rgba(226,222,212,${0.8 - p * 0.3})`;
      ctx.lineWidth = 3.4;
      for (let i = 0; i < 3; i++) {
        const yy = fx.y + i * 16;
        ctx.beginPath();
        ctx.moveTo(fx.x - 16, yy);
        ctx.quadraticCurveTo(fx.x, yy - 8 + Math.sin(p * 10 + i) * 6, fx.x + 16, yy);
        ctx.stroke();
      }
      break;
    }
    case 'ball': {
      const bx = fx.x + ((fx.toX ?? fx.x + 240) - fx.x) * p;
      const by = fx.y + ((fx.toY ?? fx.y - 80) - fx.y) * p - Math.sin(p * Math.PI) * 120;
      ctx.fillStyle = '#E8B36A';
      ctx.beginPath();
      ctx.arc(bx, by, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,22,30,0.7)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      break;
    }
    case 'gift': {
      const bx = fx.x + ((fx.toX ?? fx.x + 160) - fx.x) * p;
      const by = fx.y + ((fx.toY ?? fx.y) - fx.y) * p - Math.sin(p * Math.PI) * 46;
      const s = 15;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.sin(p * Math.PI * 2) * 0.12);
      ctx.fillStyle = '#C25E7E';
      ctx.strokeStyle = 'rgba(60,36,30,0.7)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.8, s * 2, s * 1.6, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F2D24E';
      ctx.fillRect(-s * 0.18, -s * 0.8, s * 0.36, s * 1.6);
      ctx.fillRect(-s, -s * 0.14, s * 2, s * 0.28);
      ctx.beginPath();
      ctx.ellipse(-s * 0.28, -s * 0.95, s * 0.3, s * 0.2, -0.5, 0, Math.PI * 2);
      ctx.ellipse(s * 0.28, -s * 0.95, s * 0.3, s * 0.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- camera

function applyCamera(
  ctx: CanvasRenderingContext2D,
  fs: FrameState,
  focusX: number
): void {
  const { camera } = fs.shot;
  if (camera === 'closeup') {
    const s = 1.5;
    const fx = Math.max(640 - 230, Math.min(640 + 230, focusX));
    const fy = 430;
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.scale(s, s);
    ctx.translate(-fx, -fy);
  } else if (camera === 'zoom') {
    const s = 1 + 0.16 * Math.max(0, Math.min(1, fs.cameraProgress));
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.scale(s, s);
    ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
  }
}

function drawVignette(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.42, CANVAS_H * 0.36, CANVAS_W / 2, CANVAS_H * 0.5, CANVAS_H * 0.86);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(6,6,12,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

// ---------------------------------------------------------------- frame

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  fs: FrameState
): void {
  const { shot } = fs;
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0C0A14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const tp = Math.max(0, Math.min(1, fs.transitionProgress));
  if (shot.transition === 'slide' && tp < 1) {
    ctx.translate((1 - tp) * CANVAS_W, 0);
  }

  const speaker = fs.speakingCharacterId
    ? fs.visuals.find((v) => v.characterId === fs.speakingCharacterId)
    : undefined;
  const focusX = speaker?.x ?? fs.visuals[0]?.x ?? CANVAS_W / 2;

  ctx.save();
  applyCamera(ctx, fs, focusX);

  const bg = getCachedImage(bgKey(shot.backgroundId));
  if (bg) {
    ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#221E30';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (shot.kind === 'title') {
    ctx.fillStyle = 'rgba(10,8,18,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const p = Math.max(0, Math.min(1, fs.transitionProgress));
    ctx.globalAlpha = p;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F5F1FF';
    ctx.font = canvasFont(800, 92);
    const titleLines = wrapText(ctx, shot.title || 'Untitled', 1000, 3);
    titleLines.forEach((l, i) => {
      ctx.fillText(l, CANVAS_W / 2, 300 + i * 100 - (titleLines.length - 1) * 50);
    });
    if (shot.subtitle) {
      ctx.font = canvasFont(500, 38);
      ctx.fillStyle = '#C9B8E8';
      ctx.fillText(shot.subtitle, CANVAS_W / 2, 300 + titleLines.length * 100 - (titleLines.length - 1) * 50 + 30);
    }
    ctx.globalAlpha = 1;
  } else {
    // ground shadows
    for (const v of fs.visuals) {
      if (!v.visible) continue;
      ctx.save();
      ctx.globalAlpha = 0.3 * v.alpha;
      ctx.fillStyle = '#000';
      const sw = v.drawH > 300 ? 105 : 70;
      ctx.beginPath();
      ctx.ellipse(v.x, v.footY + 4, sw, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // actors
    for (const v of fs.visuals) {
      if (!v.visible) continue;
      const ch = fs.characters[v.characterId];
      ctx.save();
      ctx.globalAlpha = v.alpha;
      ctx.translate(v.x, v.footY);
      const lean = v.lean ?? 0;
      if (ch && isAnimal(ch)) {
        if (v.rotation || lean) ctx.rotate(v.rotation + lean);
        const species = ch.species ?? 'dog';
        const drawH = animalDrawH(ch, v.position);
        const spriteH = ANIMAL_SPRITE_H[species];
        const scale = drawH / spriteH;
        const img = getCachedImage(animalKey(species, ch.look.skin, v.animalVariant ?? 'idle'));
        const w = img ? img.width : 300 * scale;
        // staged flip: pivots through a thin edge-on sliver instead of popping
        const turnScale = animalTurnScale(v);
        ctx.scale((v.scaleX ?? 1) * turnScale, v.scaleY ?? 1);
        if (img) {
          ctx.drawImage(img, -w / 2, -drawH + 8, w, drawH);
        } else {
          ctx.fillStyle = '#3A3548';
          ctx.beginPath();
          ctx.ellipse(0, -drawH / 2, drawH * 0.5, drawH * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // orientation: staged cartoon pivot — anticipation, whip-through with
        // overshoot, weight dip, settle; head yaw leads the shoulders
        const turn = turnDynamics(v);
        if (v.rotation || lean || turn.rot) ctx.rotate(v.rotation + lean + turn.rot);
        const s = v.drawH / 768;
        const w = SPRITE_W * s;
        ctx.scale((v.scaleX ?? 1) * turn.bodyScale, (v.scaleY ?? 1) * (1 - turn.dipPx / 520));
        let img = ch
          ? getCachedImage(lookKey(ch.look, v.pose ?? 'idle', turn.useBack ? 'back' : 'front'))
          : undefined;
        if (!img && turn.useBack && ch) {
          // back sprite not rasterized yet — fall back to the front view
          img = getCachedImage(lookKey(ch.look, v.pose ?? 'idle', 'front'));
        }
        if (img) {
          ctx.drawImage(img, -w / 2, -v.drawH, w, v.drawH);
        } else {
          placeholderSprite(ctx, v.drawH);
        }
        const talk = v.characterId === fs.speakingCharacterId ? fs.talkOpen : 0;
        const faceVis = ch ? turn.faceVis : 0;
        if (ch && faceVis > 0.02) {
          ctx.save();
          ctx.globalAlpha *= faceVis;
          drawFace(ctx, 0, -v.drawH + faceAnchor(ch.look).cy * s, s, {
            emotion: v.emotion,
            talkOpen: talk,
            look: ch.look,
            blinkOpen: blinkOpenAt(v.castId, fs.tMs),
            gaze: { dx: v.gazeDx ?? 0, dy: v.gazeDy ?? 0 },
            yaw: turn.yaw,
          });
          ctx.restore();
        }
      }
      ctx.restore();
    }
    // interaction fx
    if (fs.fx) {
      for (const f of fs.fx) drawFx(ctx, f);
    }
  }
  ctx.restore(); // camera

  drawVignette(ctx);

  // speech bubble (screen space)
  if (fs.beatText && fs.beatCharacterId && shot.kind === 'scene') {
    const v = fs.visuals.find((x) => x.characterId === fs.beatCharacterId);
    const ch = fs.beatCharacterId ? fs.characters[fs.beatCharacterId] : undefined;
    if (v && ch && v.visible) {
      const headTopY = v.footY - v.drawH * (isAnimal(ch) ? 0.55 : 0.82);
      drawBubble(ctx, v.x, headTopY, ch.name, fs.beatText, v.bubbleDx ?? 0);
    }
  }

  if (fs.beatText) {
    drawSubtitle(ctx, fs.beatText);
  }

  if (shot.transition === 'fade' && tp < 1) {
    ctx.fillStyle = `rgba(8,6,14,${1 - tp})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  ctx.restore();
}

/** Static preview render (editor idle state) */
export function drawStaticFrame(
  ctx: CanvasRenderingContext2D,
  shot: Shot,
  characters: Record<string, Character>,
  opts?: { beatText?: string | null; beatCharacterId?: string | null; emotionOverride?: Emotion }
): void {
  const tMs = typeof performance !== 'undefined' ? performance.now() : 0;
  const visuals = restingVisuals(shot, characters).map((v) => {
    const ch = characters[v.characterId];
    if (ch && isAnimal(ch)) {
      return { ...v, drawH: animalDrawH(ch, v.position), flip: v.position === 'right' };
    }
    // in the editor, side characters face the middle of the stage
    const facing: Facing | undefined =
      shot.cast.length > 1
        ? v.position === 'left'
          ? 'right'
          : v.position === 'right'
            ? 'left'
            : 'front'
        : 'front';
    const withEmotion =
      opts?.emotionOverride && v.characterId === opts.beatCharacterId
        ? { ...v, emotion: opts.emotionOverride }
        : v;
    return { ...withEmotion, facing, facingFrom: facing, turnK: 1 };
  });
  drawFrame(ctx, {
    shot,
    characters,
    visuals,
    speakingCharacterId: null,
    talkOpen: 0,
    beatText: opts?.beatText ?? null,
    beatCharacterId: opts?.beatCharacterId ?? null,
    cameraProgress: 1,
    transitionProgress: 1,
    tMs,
    fx: [],
  });
}
