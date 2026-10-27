import type { CharacterLook, Emotion } from '@/lib/types';
import { faceAnchor } from '@/lib/character-svg';

/**
 * Facial expressions for the silhouette look: luminous, minimal features
 * drawn dynamically on the canvas so the mouth can animate (lip-sync).
 * All geometry derives from the head anchor of the character's look.
 */

interface FaceParams {
  browAngle: number; // + = inner ends down (angry), - = inner ends up (sad)
  browLift: number;
  eyeOpen: number; // 1 = open, 0 = closed
  mouth: 'flat' | 'smile' | 'frown' | 'oh' | 'wavy';
  mouthCurve: number;
  blush: boolean;
}

export const EMOTION_FACES: Record<Emotion, FaceParams> = {
  neutral: { browAngle: 0, browLift: 0, eyeOpen: 1, mouth: 'flat', mouthCurve: 4, blush: false },
  happy: { browAngle: -5, browLift: 4, eyeOpen: 0.8, mouth: 'smile', mouthCurve: 15, blush: true },
  sad: { browAngle: -16, browLift: -2, eyeOpen: 0.62, mouth: 'frown', mouthCurve: 11, blush: false },
  angry: { browAngle: 18, browLift: -4, eyeOpen: 0.74, mouth: 'frown', mouthCurve: 13, blush: false },
  surprised: { browAngle: 0, browLift: 10, eyeOpen: 1.25, mouth: 'oh', mouthCurve: 0, blush: false },
  scared: { browAngle: -12, browLift: 8, eyeOpen: 1.12, mouth: 'wavy', mouthCurve: 8, blush: false },
};

export interface FaceDrawOpts {
  emotion: Emotion;
  /** 0..1 how open the mouth is (talking). 0 = resting expression mouth. */
  talkOpen: number;
  look: CharacterLook;
}

export function drawFace(
  ctx: CanvasRenderingContext2D,
  headCx: number,
  headCy: number,
  s: number,
  opts: FaceDrawOpts
): void {
  const a = faceAnchor(opts.look);
  const rx = a.rx * s;
  const ry = a.ry * s;
  const cx = headCx;
  const cy = headCy;
  const p = EMOTION_FACES[opts.emotion] ?? EMOTION_FACES.neutral;

  // features are luminous on the dark head — tinted with the accent
  const ink = opts.look.skin;
  const inkSoft = opts.look.skin;

  const eyeDX = rx * 0.44;
  const eyeY = cy - ry * 0.02;
  const eyeW = rx * 0.3;
  const eyeH = rx * 0.17 * Math.max(0.12, p.eyeOpen);
  const browY = eyeY - ry * 0.24 - p.browLift * s * 1.6;
  const mouthY = cy + ry * 0.52;
  const lw = Math.max(2.2, rx * 0.085);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ---- brows ----
  ctx.strokeStyle = inkSoft;
  ctx.lineWidth = lw * 0.82;
  for (const side of [-1, 1]) {
    const bx = cx + side * eyeDX;
    const half = eyeW * 0.78;
    const tilt = side * p.browAngle;
    const yInner = browY + Math.sin((tilt * Math.PI) / 180) * half * 0.9;
    const yOuter = browY - Math.sin((tilt * Math.PI) / 180) * half * 0.5;
    ctx.beginPath();
    ctx.moveTo(bx - side * half, yOuter);
    ctx.quadraticCurveTo(bx, browY - lw * 0.4, bx + side * half, yInner);
    ctx.stroke();
  }

  // ---- eyes (almond with a luminous glint) ----
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeDX;
    if (p.eyeOpen <= 0.24) {
      ctx.strokeStyle = inkSoft;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 0.8, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + eyeH, ex + eyeW * 0.8, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = inkSoft;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      // dark pupil
      ctx.fillStyle = 'rgba(10,12,18,0.9)';
      ctx.beginPath();
      ctx.ellipse(ex + side * 1.2 * s, eyeY + eyeH * 0.1, eyeW * 0.42, eyeH * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      // glint
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(ex - eyeW * 0.16, eyeY - eyeH * 0.22, Math.max(1.1, eyeW * 0.13), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- blush (subtle) ----
  if (p.blush) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#E88A8A';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * rx * 0.62, mouthY - ry * 0.14, rx * 0.16, ry * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- mouth ----
  const talk = Math.max(0, Math.min(1, opts.talkOpen));
  if (talk > 0.07) {
    const w = rx * 0.4;
    const h = ry * (0.1 + 0.42 * talk);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(8,9,13,0.92)';
    ctx.ellipse(cx, mouthY, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = inkSoft;
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
  } else {
    ctx.strokeStyle = inkSoft;
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    const mw = rx * 0.42;
    switch (p.mouth) {
      case 'smile':
        ctx.moveTo(cx - mw, mouthY - p.mouthCurve * s * 0.35);
        ctx.quadraticCurveTo(cx, mouthY + p.mouthCurve * s * 1.05, cx + mw, mouthY - p.mouthCurve * s * 0.35);
        ctx.stroke();
        break;
      case 'frown':
        ctx.moveTo(cx - mw * 0.9, mouthY + p.mouthCurve * s * 0.45);
        ctx.quadraticCurveTo(cx, mouthY - p.mouthCurve * s * 0.85, cx + mw * 0.9, mouthY + p.mouthCurve * s * 0.45);
        ctx.stroke();
        break;
      case 'oh':
        ctx.beginPath();
        ctx.fillStyle = 'rgba(8,9,13,0.92)';
        ctx.ellipse(cx, mouthY, mw * 0.34, mw * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'wavy':
        ctx.moveTo(cx - mw, mouthY);
        ctx.quadraticCurveTo(cx - mw * 0.45, mouthY - 5 * s, cx, mouthY);
        ctx.quadraticCurveTo(cx + mw * 0.45, mouthY + 5 * s, cx + mw, mouthY);
        ctx.stroke();
        break;
      case 'flat':
      default:
        ctx.moveTo(cx - mw * 0.85, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + p.mouthCurve * s * 0.5, cx + mw * 0.85, mouthY);
        ctx.stroke();
        break;
    }
  }

  // ---- glasses ----
  if (opts.look.glasses) {
    ctx.strokeStyle = 'rgba(228,222,208,0.85)';
    ctx.lineWidth = lw * 0.62;
    const gr = eyeW * 1.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(cx + side * eyeDX - gr, eyeY - gr * 0.82, gr * 2, gr * 1.6, gr * 0.42);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - eyeDX + gr, eyeY - 2 * s);
    ctx.lineTo(cx + eyeDX - gr, eyeY - 2 * s);
    ctx.stroke();
  }

  ctx.restore();
}

/** Head center in canvas coordinates for a character drawn with baseline feet at `footY` */
export function headCenterFor(
  look: CharacterLook,
  footY: number,
  drawH: number
): { cx: number; cy: number; s: number } {
  const a = faceAnchor(look);
  const s = drawH / 768;
  return { cx: a.cx * s, cy: footY - drawH + a.cy * s, s };
}
