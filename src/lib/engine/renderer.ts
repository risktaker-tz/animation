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

/** Horizontal body scale while pivoting between facings (cartoon turn-around) */
export function facingBodyScale(v: CastVisual): number {
  if (!v.facing) return 1;
  const to = FACING_SCALE[v.facing];
  const from = FACING_SCALE[v.facingFrom ?? v.facing];
  if (from === to) return to;
  return from + (to - from) * easeSine(v.turnK ?? 1);
}

/** Face visibility (0..1) — fades out at edge-on moments of a turn */
function faceVisibility(bodyScale: number, v: CastVisual): number {
  const turningToBack = v.facing === 'back' || v.facingFrom === 'back';
  if (turningToBack && (v.turnK ?? 1) >= 0.999 && v.facing === 'back') return 0;
  if (!turningToBack) return 1;
  return Math.max(0, Math.min(1, (Math.abs(bodyScale) - 0.3) / 0.24));
}

/** 3/4 head-turn amount (0..1) implied by the current facing pivot */
function faceYaw(v: CastVisual): number {
  const side = (f?: Facing) => (f === 'left' || f === 'right' ? 1 : 0);
  const from = side(v.facingFrom ?? v.facing);
  const to = side(v.facing);
  if (from === to) return to;
  return from + (to - from) * easeSine(v.turnK ?? 1);
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
      if (v.rotation || lean) ctx.rotate(v.rotation + lean);
      if (ch && isAnimal(ch)) {
        const species = ch.species ?? 'dog';
        const drawH = animalDrawH(ch, v.position);
        const spriteH = ANIMAL_SPRITE_H[species];
        const scale = drawH / spriteH;
        const img = getCachedImage(animalKey(species, ch.look.skin, v.animalVariant ?? 'idle'));
        const w = img ? img.width : 300 * scale;
        if (v.flip) ctx.scale(-1, 1);
        if (img) {
          ctx.drawImage(img, -w / 2, -drawH + 8, w, drawH);
        } else {
          ctx.fillStyle = '#3A3548';
          ctx.beginPath();
          ctx.ellipse(0, -drawH / 2, drawH * 0.5, drawH * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const s = v.drawH / 768;
        const w = SPRITE_W * s;
        // orientation: cartoon pivot (body squash-through), sprite view + face fade
        const bodyScale = facingBodyScale(v);
        const k = Math.max(0, Math.min(1, v.turnK ?? 1));
        const toBack = v.facing === 'back';
        const fromBack = v.facingFrom === 'back' && !toBack;
        const useBack = (toBack && k >= 0.5) || (fromBack && k < 0.5);
        ctx.scale((v.scaleX ?? 1) * bodyScale, v.scaleY ?? 1);
        let img = ch
          ? getCachedImage(lookKey(ch.look, v.pose ?? 'idle', useBack ? 'back' : 'front'))
          : undefined;
        if (!img && useBack && ch) {
          // back sprite not rasterized yet — fall back to the front view
          img = getCachedImage(lookKey(ch.look, v.pose ?? 'idle', 'front'));
        }
        if (img) {
          ctx.drawImage(img, -w / 2, -v.drawH, w, v.drawH);
        } else {
          placeholderSprite(ctx, v.drawH);
        }
        const talk = v.characterId === fs.speakingCharacterId ? fs.talkOpen : 0;
        const faceVis = ch ? faceVisibility(bodyScale, v) : 0;
        if (ch && faceVis > 0.02) {
          ctx.save();
          ctx.globalAlpha *= faceVis;
          drawFace(ctx, 0, -v.drawH + faceAnchor(ch.look).cy * s, s, {
            emotion: v.emotion,
            talkOpen: talk,
            look: ch.look,
            blinkOpen: blinkOpenAt(v.castId, fs.tMs),
            gaze: { dx: v.gazeDx ?? 0, dy: v.gazeDy ?? 0 },
            yaw: faceYaw(v),
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
