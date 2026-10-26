import type { Emotion } from '@/lib/types';
import { HEAD_CX, HEAD_CY } from '@/lib/character-svg';

/**
 * Facial expressions are drawn dynamically on the canvas so that the mouth
 * can animate (lip-sync approximation) while a character speaks.
 * All geometry below is in sprite units and scaled by SPRITE_SCALE at draw time.
 */

interface FaceParams {
  browAngle: number; // + = inner ends down (angry), - = inner ends up (sad)
  browLift: number;
  eyeOpen: number; // 1 = round open, 0 = closed
  pupilScale: number;
  mouth: 'flat' | 'smile' | 'frown' | 'oh' | 'wavy';
  mouthCurve: number;
  blush: boolean;
}

export const EMOTION_FACES: Record<Emotion, FaceParams> = {
  neutral: { browAngle: 0, browLift: 0, eyeOpen: 1, pupilScale: 1, mouth: 'flat', mouthCurve: 4, blush: false },
  happy: { browAngle: -4, browLift: 5, eyeOpen: 0.82, pupilScale: 1, mouth: 'smile', mouthCurve: 15, blush: true },
  sad: { browAngle: -15, browLift: -3, eyeOpen: 0.68, pupilScale: 1.05, mouth: 'frown', mouthCurve: 11, blush: false },
  angry: { browAngle: 17, browLift: -5, eyeOpen: 0.72, pupilScale: 0.95, mouth: 'frown', mouthCurve: 13, blush: false },
  surprised: { browAngle: 0, browLift: 11, eyeOpen: 1.16, pupilScale: 0.7, mouth: 'oh', mouthCurve: 0, blush: false },
  scared: { browAngle: -12, browLift: 9, eyeOpen: 1.1, pupilScale: 0.8, mouth: 'wavy', mouthCurve: 8, blush: false },
};

const INK = '#33261F';
const MOUTH_FILL = '#8E3B44';

export interface FaceDrawOpts {
  emotion: Emotion;
  /** 0..1 how open the mouth is (talking). 0 = resting expression mouth. */
  talkOpen: number;
  glasses: boolean;
}

export function drawFace(
  ctx: CanvasRenderingContext2D,
  headCx: number,
  headCy: number,
  s: number,
  opts: FaceDrawOpts
): void {
  const p = EMOTION_FACES[opts.emotion] ?? EMOTION_FACES.neutral;
  const eyeDX = 40 * s;
  const eyeDY = -6 * s;
  const eyeR = 14.5 * s;
  const browY = headCy + (HEAD_CY - 34 - HEAD_CY) * s + -p.browLift * s; // HEAD_CY-34 offset
  const mouthY = headCy + 42 * s;

  ctx.save();
  ctx.lineCap = 'round';

  // ---- brows ----
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.5 * s;
  for (const side of [-1, 1]) {
    const cx0 = headCx + side * eyeDX;
    const half = 16 * s;
    const innerTilt = side * p.browAngle * 0.55; // degrees-ish scaled
    const outerTilt = -side * p.browAngle * 0.25;
    const yInner = browY + Math.sin((innerTilt * Math.PI) / 180) * half;
    const yOuter = browY + Math.sin((outerTilt * Math.PI) / 180) * half;
    ctx.beginPath();
    ctx.moveTo(cx0 - side * half, yOuter);
    ctx.lineTo(cx0 + side * half, yInner);
    ctx.stroke();
  }

  // ---- eyes ----
  for (const side of [-1, 1]) {
    const ex = headCx + side * eyeDX;
    const ey = headCy + eyeDY;
    if (p.eyeOpen <= 0.1) {
      ctx.beginPath();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4.5 * s;
      ctx.moveTo(ex - eyeR * 0.8, ey);
      ctx.lineTo(ex + eyeR * 0.8, ey);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF';
      ctx.ellipse(ex, ey, eyeR, eyeR * p.eyeOpen, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2 * s;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
      // pupil
      ctx.beginPath();
      ctx.fillStyle = INK;
      ctx.ellipse(
        ex,
        ey + 1.5 * s,
        6.5 * s * p.pupilScale,
        7.5 * s * p.pupilScale * Math.min(1, p.eyeOpen),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // ---- blush ----
  if (p.blush) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#E88A8A';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(headCx + side * 56 * s, headCy + 20 * s, 13 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- mouth ----
  const talk = Math.max(0, Math.min(1, opts.talkOpen));
  if (talk > 0.06) {
    const w = 26 * s;
    const h = (9 + 24 * talk) * s;
    ctx.beginPath();
    ctx.fillStyle = MOUTH_FILL;
    ctx.ellipse(headCx, mouthY, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    // tongue hint
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.ellipse(headCx, mouthY - h * 0.35, w * 0.55, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    switch (p.mouth) {
      case 'smile':
        ctx.moveTo(headCx - 24 * s, mouthY - p.mouthCurve * s * 0.4);
        ctx.quadraticCurveTo(headCx, mouthY + p.mouthCurve * s * 1.2, headCx + 24 * s, mouthY - p.mouthCurve * s * 0.4);
        ctx.stroke();
        break;
      case 'frown':
        ctx.moveTo(headCx - 22 * s, mouthY + p.mouthCurve * s * 0.5);
        ctx.quadraticCurveTo(headCx, mouthY - p.mouthCurve * s * 0.9, headCx + 22 * s, mouthY + p.mouthCurve * s * 0.5);
        ctx.stroke();
        break;
      case 'oh': {
        ctx.beginPath();
        ctx.fillStyle = MOUTH_FILL;
        ctx.ellipse(headCx, mouthY + 2 * s, 12 * s, 15 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'wavy':
        ctx.moveTo(headCx - 22 * s, mouthY);
        ctx.quadraticCurveTo(headCx - 10 * s, mouthY - 8 * s, headCx, mouthY);
        ctx.quadraticCurveTo(headCx + 10 * s, mouthY + 8 * s, headCx + 22 * s, mouthY);
        ctx.stroke();
        break;
      case 'flat':
      default:
        ctx.moveTo(headCx - 20 * s, mouthY);
        ctx.quadraticCurveTo(headCx, mouthY + p.mouthCurve * s * 0.6, headCx + 20 * s, mouthY);
        ctx.stroke();
        break;
    }
  }

  ctx.restore();
}

/** Head center in canvas coordinates for a character drawn with baseline feet at `footY` */
export function headCenterFor(footY: number, drawH: number): { cx: number; cy: number; s: number } {
  const s = drawH / 768;
  return { cx: HEAD_CX * s, cy: footY - drawH + HEAD_CY * s, s };
}
