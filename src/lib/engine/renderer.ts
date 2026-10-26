import type { CastEntry, Character, Emotion, Position, Shot } from '@/lib/types';
import { lookKey, SPRITE_W, DRAW_H } from '@/lib/character-svg';
import { drawFace } from '@/lib/emotions';
import { bgKey, getCachedImage } from '@/lib/engine/images';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const FOOT_Y = 640;

export const POSITION_X: Record<Position, number> = {
  left: 300,
  center: 640,
  right: 980,
};

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
}

export function drawHFor(position: Position): number {
  return position === 'center' ? DRAW_H + 14 : DRAW_H - 8;
}

export function restingVisual(entry: CastEntry): CastVisual {
  return {
    castId: entry.id,
    characterId: entry.characterId,
    position: entry.position,
    emotion: entry.emotion,
    x: POSITION_X[entry.position],
    footY: FOOT_Y,
    drawH: drawHFor(entry.position),
    alpha: 1,
    rotation: 0,
    visible: true,
  };
}

export function restingVisuals(shot: Shot): CastVisual[] {
  return shot.cast.map(restingVisual);
}

// ---------------------------------------------------------------- helpers

let CACHED_FONT_FAMILY: string | null = null;

/**
 * Canvas font strings cannot use CSS variables — resolve the real font
 * family once (the next/font Geist family) and reuse it.
 */
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
    // check overflow on the last rendered line
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
  text: string
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
  let bx = headX - bw / 2;
  bx = Math.max(14, Math.min(CANVAS_W - bw - 14, bx));
  let by = headTopY - bh - 26;
  if (by < 14) by = 14;

  // tail
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

  // speaker name
  ctx.fillStyle = '#8E5AC8';
  ctx.font = canvasFont(700, 21);
  ctx.fillText(speakerName.toUpperCase(), bx + padX, by + 26);

  // body text
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

function placeholderSprite(
  ctx: CanvasRenderingContext2D,
  drawH: number
): void {
  const w = SPRITE_W * (drawH / 768);
  ctx.fillStyle = '#3A3548';
  roundRect(ctx, -w / 2 + w * 0.18, -drawH, w * 0.64, drawH, w * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -drawH + drawH * 0.2, drawH * 0.11, 0, Math.PI * 2);
  ctx.fill();
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

  // slide transition offset (whole world slides in)
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

  // background
  const bg = getCachedImage(bgKey(shot.backgroundId));
  if (bg) {
    ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = '#221E30';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (shot.kind === 'title') {
    // dim + title card
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
    // cast shadows
    for (const v of fs.visuals) {
      if (!v.visible) continue;
      ctx.save();
      ctx.globalAlpha = 0.3 * v.alpha;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(v.x, v.footY + 4, 105, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // characters (stable order; render speaking last so bubble overlaps nicely)
    for (const v of fs.visuals) {
      if (!v.visible) continue;
      ctx.save();
      ctx.globalAlpha = v.alpha;
      ctx.translate(v.x, v.footY);
      if (v.rotation) ctx.rotate(v.rotation);
      const s = v.drawH / 768;
      const ch = fs.characters[v.characterId];
      const img = ch ? getCachedImage(lookKey(ch.look)) : undefined;
      if (img) {
        const w = SPRITE_W * s;
        ctx.drawImage(img, -w / 2, -v.drawH, w, v.drawH);
      } else {
        placeholderSprite(ctx, v.drawH);
      }
      const talk = v.characterId === fs.speakingCharacterId ? fs.talkOpen : 0;
      drawFace(ctx, 0, -v.drawH + 150 * s, s, {
        emotion: v.emotion,
        talkOpen: talk,
        glasses: ch?.look.glasses ?? false,
      });
      ctx.restore();
    }
  }
  ctx.restore(); // camera

  // speech bubble (screen space)
  if (fs.beatText && fs.beatCharacterId && shot.kind === 'scene') {
    const v = fs.visuals.find((x) => x.characterId === fs.beatCharacterId);
    const ch = fs.beatCharacterId ? fs.characters[fs.beatCharacterId] : undefined;
    if (v && ch && v.visible) {
      const s = v.drawH / 768;
      const headTopY = v.footY - v.drawH + 150 * s - 86 * s;
      drawBubble(ctx, v.x, headTopY, ch.name, fs.beatText);
    }
  }

  // subtitles for every spoken beat (also covers narrator)
  if (fs.beatText) {
    drawSubtitle(ctx, fs.beatText);
  }

  // fade transition overlay
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
  const visuals = restingVisuals(shot).map((v) =>
    opts?.emotionOverride && v.characterId === opts.beatCharacterId
      ? { ...v, emotion: opts.emotionOverride }
      : v
  );
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
  });
}
