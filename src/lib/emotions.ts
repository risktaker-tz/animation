import type { CharacterLook, Emotion } from '@/lib/types';
import { faceAnchor, shade } from '@/lib/character-svg';

/**
 * Facial expressions v3 — soft-3D cartoon faces drawn dynamically on the
 * canvas so eyes can blink, gaze can track a partner and the mouth can
 * animate (lip-sync). All geometry derives from the head anchor.
 */

interface FaceParams {
  browAngle: number; // + = inner ends down (angry), - = inner ends up (sad)
  browLift: number;
  eyeOpen: number; // 1 = open, 0 = closed
  mouth: 'flat' | 'smile' | 'frown' | 'oh' | 'wavy';
  mouthCurve: number;
  blush: number; // 0..1
}

export const EMOTION_FACES: Record<Emotion, FaceParams> = {
  neutral: { browAngle: 0, browLift: 0, eyeOpen: 1, mouth: 'flat', mouthCurve: 5, blush: 0.08 },
  happy: { browAngle: -5, browLift: 4, eyeOpen: 0.82, mouth: 'smile', mouthCurve: 15, blush: 0.3 },
  sad: { browAngle: -16, browLift: -2, eyeOpen: 0.62, mouth: 'frown', mouthCurve: 11, blush: 0.05 },
  angry: { browAngle: 18, browLift: -4, eyeOpen: 0.74, mouth: 'frown', mouthCurve: 13, blush: 0.12 },
  surprised: { browAngle: 0, browLift: 10, eyeOpen: 1.22, mouth: 'oh', mouthCurve: 0, blush: 0.1 },
  scared: { browAngle: -12, browLift: 8, eyeOpen: 1.1, mouth: 'wavy', mouthCurve: 8, blush: 0.06 },
};

export interface FaceDrawOpts {
  emotion: Emotion;
  /** 0..1 how open the mouth is (talking). 0 = resting expression mouth. */
  talkOpen: number;
  look: CharacterLook;
  /** 0..1 eyelid openness multiplier (blinks), default 1 */
  blinkOpen?: number;
  /** gaze offset in units of head radius, clamped to [-1,1] */
  gaze?: { dx: number; dy: number };
}

/** Deterministic blink clock: every character blinks ~every 3.6 s (with jitter) */
export function blinkOpenAt(castId: string, tMs: number): number {
  let h = 0;
  for (let i = 0; i < castId.length; i++) h = ((h << 5) + h + castId.charCodeAt(i)) >>> 0;
  const phase = h % 3600;
  const period = 3400 + (h % 900);
  const t = (tMs + phase) % period;
  const blinkLen = 150;
  if (t > period - blinkLen || t <= 40) {
    // triangle 0→1→0 (1 = fully closed)
    const bt = t <= 40 ? t + 40 : t - (period - blinkLen);
    const k = Math.min(1, bt / (blinkLen / 2));
    const closed = k < 1 ? k : 2 - k;
    return 1 - Math.max(0, Math.min(1, closed)) * 0.96;
  }
  // occasional quick double-blink
  if ((h % 3 === 0) && t > 700 && t < 860) {
    const bt = t - 700;
    const closed = bt < 80 ? bt / 80 : 2 - bt / 80;
    return 1 - Math.max(0, Math.min(1, closed)) * 0.9;
  }
  return 1;
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
  const blink = Math.max(0.06, Math.min(1, opts.blinkOpen ?? 1));
  const gazeX = Math.max(-1, Math.min(1, opts.gaze?.dx ?? 0));
  const gazeY = Math.max(-1, Math.min(1, opts.gaze?.dy ?? 0));

  const eyeDX = rx * 0.44;
  const eyeY = cy - ry * 0.02;
  const eyeW = rx * 0.27;
  const eyeH = rx * 0.3 * Math.max(0.05, p.eyeOpen) * blink;
  const browY = eyeY - ry * 0.26 - p.browLift * s * 1.6;
  const mouthY = cy + ry * 0.52;
  const lw = Math.max(2.2, rx * 0.085);

  const skin = opts.look.skin;
  const browCol = shade(opts.look.hairColor, -6);
  const iris = opts.look.irisColor ?? '#5B7C99';
  const lipCol = 'rgba(168,88,88,0.92)';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ---- eye sockets (subtle AO) ----
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeDX;
    const grad = ctx.createRadialGradient(ex, eyeY, eyeW * 0.2, ex, eyeY, eyeW * 1.7);
    grad.addColorStop(0, 'rgba(90,60,40,0.16)');
    grad.addColorStop(1, 'rgba(90,60,40,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW * 1.7, eyeW * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- eyes ----
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeDX;
    const px = ex + gazeX * eyeW * 0.42;
    const py = eyeY + gazeY * eyeW * 0.3;

    if (blink <= 0.14) {
      // closed: soft lash curve
      ctx.strokeStyle = 'rgba(70,45,35,0.85)';
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 0.9, eyeY + eyeH * 0.4);
      ctx.quadraticCurveTo(ex, eyeY + eyeH * 1.4, ex + eyeW * 0.9, eyeY + eyeH * 0.4);
      ctx.stroke();
      continue;
    }

    // sclera
    const sclera = ctx.createLinearGradient(ex, eyeY - eyeH, ex, eyeY + eyeH);
    sclera.addColorStop(0, '#FFFFFF');
    sclera.addColorStop(1, '#D9D4CE');
    ctx.fillStyle = sclera;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // iris + pupil (clipped to the eye)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.clip();
    const irisR = Math.min(eyeH * 0.95, eyeW * 0.78);
    const irisGrad = ctx.createRadialGradient(px - irisR * 0.3, py - irisR * 0.3, irisR * 0.1, px, py, irisR);
    irisGrad.addColorStop(0, shade(iris, 60));
    irisGrad.addColorStop(0.55, iris);
    irisGrad.addColorStop(1, shade(iris, -50));
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(px, py, irisR, 0, Math.PI * 2);
    ctx.fill();
    // pupil
    ctx.fillStyle = 'rgba(22,16,14,0.95)';
    ctx.beginPath();
    ctx.arc(px, py, irisR * 0.42, 0, Math.PI * 2);
    ctx.fill();
    // catchlights
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(px - irisR * 0.34, py - irisR * 0.38, Math.max(1.2, irisR * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(px + irisR * 0.3, py + irisR * 0.32, Math.max(0.8, irisR * 0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // upper lash line
    ctx.strokeStyle = 'rgba(70,45,35,0.9)';
    ctx.lineWidth = lw * 0.92;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.92, eyeY - eyeH * 0.24);
    ctx.quadraticCurveTo(ex, eyeY - eyeH * (0.85 + 0.35 * blink), ex + eyeW * 0.92, eyeY - eyeH * 0.24);
    ctx.stroke();
    // lower lid hint
    ctx.strokeStyle = 'rgba(120,80,60,0.35)';
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW * 0.7, eyeY + eyeH * 0.78);
    ctx.quadraticCurveTo(ex, eyeY + eyeH * 1.02, ex + eyeW * 0.7, eyeY + eyeH * 0.78);
    ctx.stroke();
  }

  // ---- brows ----
  ctx.strokeStyle = browCol;
  ctx.lineWidth = lw * 1.25;
  for (const side of [-1, 1]) {
    const bx = cx + side * eyeDX;
    const half = eyeW * 0.85;
    const tilt = side * p.browAngle;
    const yInner = browY + Math.sin((tilt * Math.PI) / 180) * half * 0.9;
    const yOuter = browY - Math.sin((tilt * Math.PI) / 180) * half * 0.5;
    ctx.beginPath();
    ctx.moveTo(bx - side * half, yOuter);
    ctx.quadraticCurveTo(bx, browY - lw * 0.5, bx + side * half, yInner);
    ctx.stroke();
  }

  // ---- nose ----
  const noseY = cy + ry * 0.24;
  ctx.strokeStyle = 'rgba(120,74,52,0.55)';
  ctx.lineWidth = lw * 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.06, noseY);
  ctx.quadraticCurveTo(cx - rx * 0.1, noseY + ry * 0.07, cx + rx * 0.02, noseY + ry * 0.085);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.05, noseY - ry * 0.02, rx * 0.045, ry * 0.025, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // ---- blush ----
  if (p.blush > 0.02) {
    for (const side of [-1, 1]) {
      const bx = cx + side * rx * 0.62;
      const by = mouthY - ry * 0.16;
      const grad = ctx.createRadialGradient(bx, by, 1, bx, by, rx * 0.22);
      grad.addColorStop(0, `rgba(232,130,130,${0.34 * p.blush})`);
      grad.addColorStop(1, 'rgba(232,130,130,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(bx, by, rx * 0.22, ry * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- mouth ----
  const talk = Math.max(0, Math.min(1, opts.talkOpen));
  if (talk > 0.07) {
    const w = rx * 0.36;
    const h = ry * (0.08 + 0.4 * talk);
    // lips
    ctx.fillStyle = lipCol;
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    // inner mouth
    ctx.fillStyle = 'rgba(46,18,20,0.95)';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + h * 0.08, w * 0.82, h * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    // tongue
    ctx.fillStyle = 'rgba(198,96,96,0.9)';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY + h * 0.42, w * 0.5, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    // upper teeth hint
    ctx.fillStyle = 'rgba(255,251,244,0.92)';
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.55, mouthY - h * 0.72, w * 1.1, h * 0.34, h * 0.14);
    ctx.fill();
  } else {
    const mw = rx * 0.4;
    ctx.strokeStyle = lipCol;
    ctx.lineWidth = lw * 1.05;
    switch (p.mouth) {
      case 'smile': {
        ctx.beginPath();
        ctx.moveTo(cx - mw, mouthY - p.mouthCurve * s * 0.35);
        ctx.quadraticCurveTo(cx, mouthY + p.mouthCurve * s * 1.05, cx + mw, mouthY - p.mouthCurve * s * 0.35);
        ctx.stroke();
        // lower lip shine
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = lw * 0.7;
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.5, mouthY + p.mouthCurve * s * 0.78);
        ctx.quadraticCurveTo(cx, mouthY + p.mouthCurve * s * 1.05, cx + mw * 0.5, mouthY + p.mouthCurve * s * 0.78);
        ctx.stroke();
        break;
      }
      case 'frown':
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.9, mouthY + p.mouthCurve * s * 0.45);
        ctx.quadraticCurveTo(cx, mouthY - p.mouthCurve * s * 0.85, cx + mw * 0.9, mouthY + p.mouthCurve * s * 0.45);
        ctx.stroke();
        break;
      case 'oh':
        ctx.fillStyle = 'rgba(46,18,20,0.9)';
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, mw * 0.3, mw * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = lipCol;
        ctx.lineWidth = lw * 0.8;
        ctx.stroke();
        break;
      case 'wavy':
        ctx.beginPath();
        ctx.moveTo(cx - mw, mouthY);
        ctx.quadraticCurveTo(cx - mw * 0.45, mouthY - 5 * s, cx, mouthY);
        ctx.quadraticCurveTo(cx + mw * 0.45, mouthY + 5 * s, cx + mw, mouthY);
        ctx.stroke();
        break;
      case 'flat':
      default:
        ctx.beginPath();
        ctx.moveTo(cx - mw * 0.85, mouthY);
        ctx.quadraticCurveTo(cx, mouthY + p.mouthCurve * s * 0.5, cx + mw * 0.85, mouthY);
        ctx.stroke();
        break;
    }
  }

  // ---- glasses ----
  if (opts.look.glasses) {
    const frame = 'rgba(52,44,48,0.9)';
    const gr = eyeW * 1.5;
    ctx.fillStyle = 'rgba(205,235,255,0.16)';
    ctx.strokeStyle = frame;
    ctx.lineWidth = lw * 0.7;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(cx + side * eyeDX - gr, eyeY - gr * 0.82, gr * 2, gr * 1.6, gr * 0.42);
      ctx.fill();
      ctx.stroke();
    }
    // glass shine
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = lw * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx - eyeDX - gr * 0.55, eyeY + gr * 0.28);
    ctx.lineTo(cx - eyeDX + gr * 0.1, eyeY - gr * 0.52);
    ctx.stroke();
    ctx.strokeStyle = frame;
    ctx.lineWidth = lw * 0.7;
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
