import type { BeatAction, CharacterLook } from '@/lib/types';

// ---------------------------------------------------------------------------
// StoryForge silhouette character system v2
// Cinematic "silhouette-inspired" look: near-black duotone figures with a
// colored rim light, subtle luminous facial features, realistic proportions.
// ---------------------------------------------------------------------------

export const SPRITE_W = 512;
export const SPRITE_H = 768;

/** Height (px) a character occupies when drawn on the 1280x720 canvas */
export const DRAW_H = 440;

export interface FaceAnchor {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface Geometry {
  head: FaceAnchor;
  chinY: number;
  neckTopY: number;
  neckW: number;
  shoulderY: number;
  shoulderLX: number;
  shoulderRX: number;
  waistY: number;
  hipY: number;
  hipHalfW: number;
  legTopY: number;
  footY: number;
  armW: number;
  torsoHalfW: number;
}

/** Figure geometry for adults vs children (children keep realistic ratios) */
export function geometry(look: CharacterLook): Geometry {
  if (look.age === 'child') {
    return {
      head: { cx: 256, cy: 212, rx: 55, ry: 64 },
      chinY: 278,
      neckTopY: 272,
      neckW: 24,
      shoulderY: 306,
      shoulderLX: 196,
      shoulderRX: 316,
      waistY: 428,
      hipY: 452,
      hipHalfW: 52,
      legTopY: 452,
      footY: 762,
      armW: 19,
      torsoHalfW: 58,
    };
  }
  return {
    head: { cx: 256, cy: 96, rx: 52, ry: 62 },
    chinY: 158,
    neckTopY: 150,
    neckW: 27,
    shoulderY: 196,
    shoulderLX: 180,
    shoulderRX: 332,
    waistY: 352,
    hipY: 402,
    hipHalfW: 58,
    legTopY: 402,
    footY: 764,
    armW: 22,
    torsoHalfW: 66,
  };
}

export function faceAnchor(look: CharacterLook): FaceAnchor {
  return geometry(look).head;
}

// ---------------------------------------------------------------- poses

export type Pose =
  | 'idle'
  | 'wave'
  | 'point'
  | 'hips'
  | 'think'
  | 'write'
  | 'read'
  | 'phone'
  | 'sit'
  | 'sad'
  | 'cheer'
  | 'hug'
  | 'highfive'
  | 'give'
  | 'whisper'
  | 'pet'
  | 'sneak'
  | 'facepalm'
  | 'salute'
  | 'clap'
  | 'shrug'
  | 'dance'
  | 'cry'
  | 'shock'
  | 'run';

export const POSE_FOR_ACTION: Partial<Record<BeatAction, Pose>> = {
  wave: 'wave',
  point: 'point',
  think: 'think',
  cheer: 'cheer',
  sulk: 'sad',
  laugh: 'clap',
  cry: 'cry',
  gasp: 'shock',
  dance: 'dance',
  sit: 'sit',
  write: 'write',
  read: 'read',
  phone: 'phone',
  sneak: 'sneak',
  run: 'run',
  facepalm: 'facepalm',
  salute: 'salute',
  clap: 'clap',
  shrug: 'shrug',
  hug: 'hug',
  highfive: 'highfive',
  give: 'give',
  whisper: 'whisper',
  pet: 'pet',
  fetch: 'point',
  jump: 'cheer',
};

interface ArmPose {
  elbow: [number, number];
  hand: [number, number];
}

/** Arm target points for the left arm (screen-left); mirrored for right */
function leftArm(pose: Pose, g: Geometry): ArmPose {
  const sy = g.shoulderY + 8;
  const sx = g.shoulderLX + 4;
  switch (pose) {
    case 'wave':
    case 'highfive':
      return { elbow: [sx - 10, sy - 30], hand: [sx - 6, g.head.cy - 34] };
    case 'cheer':
      return { elbow: [sx - 4, sy - 50], hand: [sx - 18, g.head.cy - 52] };
    case 'point':
      return { elbow: [sx + 8, sy + 40], hand: [sx + 44, sy + 62] };
    case 'hips':
      return { elbow: [sx - 26, sy + 70], hand: [sx + 36, g.hipY - 14] };
    case 'think':
      return { elbow: [sx - 18, sy + 60], hand: [sx + 62, g.chinY - 8] };
    case 'write':
    case 'read':
    case 'give':
    case 'clap':
      return { elbow: [sx - 4, sy + 62], hand: [sx + 56, sy + 116] };
    case 'phone':
      return { elbow: [sx - 20, sy + 66], hand: [sx + 26, sy + 118] };
    case 'sit':
      return { elbow: [sx - 16, sy + 58], hand: [sx + 30, g.hipY - 8] };
    case 'sad':
    case 'cry':
      return { elbow: [sx - 2, sy + 58], hand: [sx + 22, sy + 150] };
    case 'hug':
      return { elbow: [sx - 2, sy + 52], hand: [sx + 66, sy + 108] };
    case 'whisper':
      return { elbow: [sx - 4, sy + 30], hand: [sx + 58, g.head.cy + 14] };
    case 'pet':
      return { elbow: [sx + 10, sy + 60], hand: [sx + 52, sy + 150] };
    case 'sneak':
      return { elbow: [sx - 20, sy + 50], hand: [sx - 8, sy + 96] };
    case 'facepalm':
      return { elbow: [sx + 6, sy + 44], hand: [sx + 52, g.head.cy - 4] };
    case 'salute':
      return { elbow: [sx - 6, sy + 40], hand: [sx + 46, g.head.cy - 30] };
    case 'shrug':
      return { elbow: [sx - 22, sy + 30], hand: [sx - 6, sy + 40] };
    case 'dance':
      return { elbow: [sx - 10, sy - 34], hand: [sx - 14, g.head.cy - 44] };
    case 'shock':
      return { elbow: [sx - 2, sy + 36], hand: [sx + 42, g.head.cy + 16] };
    case 'run':
      return { elbow: [sx - 26, sy + 40], hand: [sx + 10, sy + 84] };
    case 'idle':
    default:
      return { elbow: [sx - 14, sy + 90], hand: [sx - 4, sy + 178] };
  }
}

function mirror(p: ArmPose, g: Geometry): ArmPose {
  const mx = (x: number) => 512 - x;
  return { elbow: [mx(p.elbow[0]), p.elbow[1]], hand: [mx(p.hand[0]), p.hand[1]] };
}

// ---------------------------------------------------------------- helpers

function shade(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amt));
  return `rgb(${r},${g},${b})`;
}

const BODY_TOP = '#2A2E3C';
const BODY_BOT = '#101219';
const CLOTH_DIM = -62;
const PANTS_DIM = -54;
const HAIR_DIM = -30;

function headPath(h: FaceAnchor): string {
  const { cx, cy, rx, ry } = h;
  const top = cy - ry;
  return [
    `M ${cx} ${top}`,
    `C ${cx + rx * 0.86} ${top + 4} ${cx + rx} ${cy - ry * 0.36} ${cx + rx} ${cy + ry * 0.08}`,
    `C ${cx + rx} ${cy + ry * 0.55} ${cx + rx * 0.6} ${cy + ry} ${cx} ${cy + ry}`,
    `C ${cx - rx * 0.6} ${cy + ry} ${cx - rx} ${cy + ry * 0.55} ${cx - rx} ${cy + ry * 0.08}`,
    `C ${cx - rx} ${cy - ry * 0.36} ${cx - rx * 0.86} ${top + 4} ${cx} ${top} Z`,
  ].join(' ');
}

function hairShapes(look: CharacterLook, g: Geometry): string {
  const c = shade(look.hairColor, HAIR_DIM);
  const h = g.head;
  const cap = `
    <path d="M ${h.cx - h.rx - 6} ${h.cy + h.ry * 0.1}
             C ${h.cx - h.rx - 8} ${h.cy - h.ry * 1.06} ${h.cx + h.rx + 8} ${h.cy - h.ry * 1.06} ${h.cx + h.rx + 6} ${h.cy + h.ry * 0.1}
             C ${h.cx + h.rx * 0.5} ${h.cy - h.ry * 0.5} ${h.cx - h.rx * 0.5} ${h.cy - h.ry * 0.5} ${h.cx - h.rx - 6} ${h.cy + h.ry * 0.1} Z"
          fill="${c}"/>`;
  const back = (extra: string) => `<g>${cap}${extra}</g>`;
  switch (look.hair) {
    case 'long':
      return back(`
        <path d="M ${h.cx - h.rx - 8} ${h.cy - 10} C ${h.cx - h.rx - 18} ${g.chinY + 120} ${h.cx - h.rx - 4} ${g.chinY + 168} ${h.cx - h.rx + 14} ${g.chinY + 178}
                 L ${h.cx - h.rx + 30} ${g.chinY + 60} C ${h.cx - h.rx + 16} ${g.chinY + 6} ${h.cx - h.rx + 12} ${h.cy} ${h.cx - h.rx - 8} ${h.cy - 10} Z" fill="${c}"/>
        <path d="M ${h.cx + h.rx + 8} ${h.cy - 10} C ${h.cx + h.rx + 18} ${g.chinY + 120} ${h.cx + h.rx + 4} ${g.chinY + 168} ${h.cx + h.rx - 14} ${g.chinY + 178}
                 L ${h.cx + h.rx - 30} ${g.chinY + 60} C ${h.cx + h.rx - 16} ${g.chinY + 6} ${h.cx + h.rx - 12} ${h.cy} ${h.cx + h.rx + 8} ${h.cy - 10} Z" fill="${c}"/>`);
    case 'wavy':
      return back(`
        <path d="M ${h.cx - h.rx - 6} ${h.cy} C ${h.cx - h.rx - 22} ${g.chinY + 90} ${h.cx - h.rx + 2} ${g.chinY + 130} ${h.cx - h.rx + 22} ${g.chinY + 140}
                 C ${h.cx - h.rx + 6} ${g.chinY + 70} ${h.cx - h.rx + 6} ${g.chinY + 20} ${h.cx - h.rx - 6} ${h.cy} Z" fill="${c}"/>
        <path d="M ${h.cx + h.rx + 6} ${h.cy} C ${h.cx + h.rx + 22} ${g.chinY + 90} ${h.cx + h.rx - 2} ${g.chinY + 130} ${h.cx + h.rx - 22} ${g.chinY + 140}
                 C ${h.cx + h.rx - 6} ${g.chinY + 70} ${h.cx + h.rx - 6} ${g.chinY + 20} ${h.cx + h.rx + 6} ${h.cy} Z" fill="${c}"/>`);
    case 'ponytail':
      return back(`
        <circle cx="${h.cx + h.rx + 16}" cy="${h.cy - 4}" r="17" fill="${shade(look.hairColor, HAIR_DIM - 18)}"/>
        <path d="M ${h.cx + h.rx + 16} ${h.cy + 10} C ${h.cx + h.rx + 44} ${g.chinY + 40} ${h.cx + h.rx + 30} ${g.chinY + 120} ${h.cx + h.rx + 8} ${g.chinY + 150}
                 C ${h.cx + h.rx + 2} ${g.chinY + 90} ${h.cx + h.rx + 2} ${g.chinY + 30} ${h.cx + h.rx + 6} ${h.cy + 16} Z" fill="${c}"/>`);
    case 'bun':
      return back(`<circle cx="${h.cx}" cy="${h.cy - h.ry - 14}" r="24" fill="${c}"/>`);
    case 'curly':
      return back(`
        <circle cx="${h.cx - h.rx + 2}" cy="${h.cy - h.ry * 0.55}" r="20" fill="${c}"/>
        <circle cx="${h.cx - h.rx * 0.45}" cy="${h.cy - h.ry - 10}" r="22" fill="${c}"/>
        <circle cx="${h.cx + h.rx * 0.45}" cy="${h.cy - h.ry - 10}" r="22" fill="${c}"/>
        <circle cx="${h.cx + h.rx - 2}" cy="${h.cy - h.ry * 0.55}" r="20" fill="${c}"/>`);
    case 'spiky':
      return back(`
        <path d="M ${h.cx - h.rx - 2} ${h.cy - 6} L ${h.cx - h.rx * 0.6} ${h.cy - h.ry - 20} L ${h.cx - h.rx * 0.2} ${h.cy - h.ry * 0.7}
                 L ${h.cx} ${h.cy - h.ry - 26} L ${h.cx + h.rx * 0.25} ${h.cy - h.ry * 0.7} L ${h.cx + h.rx * 0.62} ${h.cy - h.ry - 18} L ${h.cx + h.rx + 2} ${h.cy - 6} Z" fill="${c}"/>`);
    case 'buzz':
      return back(`
        <path d="M ${h.cx - h.rx - 2} ${h.cy + h.ry * 0.05}
                 C ${h.cx - h.rx - 2} ${h.cy - h.ry - 12} ${h.cx + h.rx + 2} ${h.cy - h.ry - 12} ${h.cx + h.rx + 2} ${h.cy + h.ry * 0.05}
                 C ${h.cx + h.rx * 0.5} ${h.cy - h.ry * 0.42} ${h.cx - h.rx * 0.5} ${h.cy - h.ry * 0.42} ${h.cx - h.rx - 2} ${h.cy + h.ry * 0.05} Z"
              fill="${c}" opacity="0.92"/>`);
    case 'short':
    default:
      return back('');
  }
}

function outfitTorso(look: CharacterLook, g: Geometry): string {
  const c = shade(look.outfitColor, CLOTH_DIM);
  const c2 = shade(look.outfitColor, CLOTH_DIM + 26);
  const { shoulderLX: lx, shoulderRX: rx2, shoulderY: sy, hipY, torsoHalfW: tw } = g;
  const base = `M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z`;
  switch (look.outfit) {
    case 'hoodie':
      return `
        <path d="${base}" fill="${c}"/>
        <path d="M 236 ${sy + 6} Q 256 ${sy + 2} 276 ${sy + 6} L 272 ${sy + 64} L 240 ${sy + 64} Z" fill="${c2}"/>
        <path d="M ${lx} ${sy} Q 256 ${sy - 40} ${rx2} ${sy} L ${rx2 - 6} ${sy + 26} Q 256 ${sy + 2} ${lx + 6} ${sy + 26} Z" fill="${shade(look.outfitColor, CLOTH_DIM + 14)}"/>`;
    case 'blazer':
      return `
        <path d="M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z" fill="${shade('#E8E4DC', CLOTH_DIM + 60)}"/>
        <path d="M ${lx} ${sy} L ${256 - 10} ${sy + 6} L ${256 - 26} ${hipY} L ${256 - tw} ${hipY - 6} Z" fill="${c}"/>
        <path d="M ${rx2} ${sy} L ${256 + 10} ${sy + 6} L ${256 + 26} ${hipY} L ${256 + tw} ${hipY - 6} Z" fill="${c}"/>`;
    case 'dress':
      return `
        <path d="M ${lx + 6} ${sy} Q 256 ${sy - 20} ${rx2 - 6} ${sy} L ${256 + tw + 26} ${hipY + 120} Q 256 ${hipY + 142} ${256 - tw - 26} ${hipY + 120} Z" fill="${c}"/>
        <path d="M ${lx + 6} ${sy} Q 256 ${sy - 20} ${rx2 - 6} ${sy} L ${rx2 - 10} ${sy + 24} Q 256 ${sy + 4} ${lx + 10} ${sy + 24} Z" fill="${c2}"/>`;
    case 'tank':
      return `
        <path d="M ${lx + 14} ${sy + 2} Q 256 ${sy - 18} ${rx2 - 14} ${sy + 2} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z" fill="${c}"/>`;
    case 'sweater':
      return `
        <path d="M ${lx - 2} ${sy + 4} Q 256 ${sy - 20} ${rx2 + 2} ${sy + 4} L ${256 + tw + 2} ${hipY + 4} Q 256 ${hipY + 18} ${256 - tw - 2} ${hipY + 4} Z" fill="${c}"/>
        <path d="M 238 ${sy + 2} Q 256 ${sy - 2} 274 ${sy + 2} L 274 ${sy + 26} Q 256 ${sy + 34} 238 ${sy + 26} Z" fill="${c2}"/>`;
    case 'tee':
    default:
      return `
        <path d="${base}" fill="${c}"/>
        <path d="M 226 ${sy - 6} Q 256 ${sy + 18} 286 ${sy - 6} Q 274 ${sy + 8} 256 ${sy + 10} Q 238 ${sy + 8} 226 ${sy - 6} Z" fill="${shade(look.skin, -10)}" opacity="0.55"/>`;
  }
}

function armStroke(p: ArmPose, g: Geometry, color: string, width: number): string {
  const sy = g.shoulderY + 6;
  const sxL = g.shoulderLX + 4;
  const [ex, ey] = p.elbow;
  const [hx, hy] = p.hand;
  return `<path d="M ${sxL} ${sy} Q ${ex} ${ey} ${hx} ${hy}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" fill="none"/>
          <circle cx="${hx}" cy="${hy}" r="${width * 0.52}" fill="${color}"/>`;
}

function legs(look: CharacterLook, g: Geometry, pose: Pose): string {
  const pc = shade(look.pantsColor, PANTS_DIM);
  const shoe = '#0C0E13';
  const lw = Math.round(g.hipHalfW * 0.52);
  if (pose === 'sit' || pose === 'pet') {
    // seated: thighs forward, shins down
    const kneeY = g.hipY + 26;
    return `
      <path d="M ${256 - 34} ${g.hipY} L ${256 + 60} ${kneeY} L ${256 + 60} ${g.footY - 26}" stroke="${pc}" stroke-width="${lw + 4}" stroke-linecap="round" fill="none"/>
      <path d="M ${256 - 10} ${g.hipY + 4} L ${256 + 82} ${kneeY + 10} L ${256 + 82} ${g.footY - 18}" stroke="${pc}" stroke-width="${lw + 4}" stroke-linecap="round" fill="none"/>
      <ellipse cx="${256 + 74}" cy="${g.footY - 10}" rx="30" ry="13" fill="${shoe}"/>
      <ellipse cx="${256 + 96}" cy="${g.footY - 6}" rx="30" ry="13" fill="${shoe}"/>
      <rect x="${256 - g.hipHalfW - 6}" y="${g.hipY - 18}" width="${g.hipHalfW * 2 + 12}" height="34" rx="14" fill="${pc}"/>`;
  }
  const lx = 256 - g.hipHalfW + lw / 2;
  const rx2 = 256 + g.hipHalfW - lw / 2;
  return `
    <path d="M ${lx} ${g.legTopY - 12} L ${lx} ${g.footY - 14}" stroke="${pc}" stroke-width="${lw}" stroke-linecap="round" fill="none"/>
    <path d="M ${rx2} ${g.legTopY - 12} L ${rx2} ${g.footY - 14}" stroke="${pc}" stroke-width="${lw}" stroke-linecap="round" fill="none"/>
    <ellipse cx="${lx}" cy="${g.footY - 4}" rx="30" ry="14" fill="${shoe}"/>
    <ellipse cx="${rx2 + 6}" cy="${g.footY - 4}" rx="30" ry="14" fill="${shoe}"/>`;
}

/** Prop drawn as part of the pose (book, pencil, phone) */
function poseProps(pose: Pose, g: Geometry, accent: string): string {
  switch (pose) {
    case 'read': {
      const by = g.shoulderY + 108;
      return `
        <g>
          <path d="M 196 ${by} Q 256 ${by - 18} 256 ${by - 14} Q 256 ${by - 18} 316 ${by} L 316 ${by + 66} Q 256 ${by + 48} 196 ${by + 66} Z" fill="${shade(accent, -20)}"/>
          <path d="M 208 ${by + 8} L 304 ${by + 8} M 208 ${by + 26} L 304 ${by + 26} M 208 ${by + 44} L 290 ${by + 44}" stroke="rgba(244,236,220,0.5)" stroke-width="5" stroke-linecap="round"/>
          <path d="M 256 ${by - 14} L 256 ${by + 52}" stroke="rgba(12,14,20,0.6)" stroke-width="5"/>
        </g>`;
    }
    case 'write':
      return `<line x1="${256 + 58}" y1="${g.shoulderY + 116}" x2="${256 + 74}" y2="${g.shoulderY + 148}" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`;
    case 'phone':
      return `<rect x="${g.shoulderLX + 20}" y="${g.head.cy + 2}" width="18" height="34" rx="5" fill="${shade(accent, -26)}" transform="rotate(-14 ${g.shoulderLX + 29} ${g.head.cy + 19})"/>`;
    case 'give':
      return `<circle cx="256" cy="${g.shoulderY + 128}" r="17" fill="${accent}" opacity="0.9"/>`;
    default:
      return '';
  }
}

/** Builds the full character sprite SVG (face features are drawn by the engine) */
export function buildCharacterSvg(look: CharacterLook, pose: Pose = 'idle'): string {
  const g = geometry(look);
  const accent = look.skin;
  const bodyCore = shade('#1C202C', 0);
  const armL = leftArm(pose, g);
  const armR = mirror(armL, g);

  const figure = `
    ${legs(look, g, pose)}
    ${armStroke(armL, g, shade(look.outfitColor, CLOTH_DIM + 8), g.armW)}
    ${armStroke(armR, g, shade(look.outfitColor, CLOTH_DIM + 8), g.armW)}
    <rect x="${256 - g.neckW / 2}" y="${g.neckTopY}" width="${g.neckW}" height="${g.shoulderY - g.neckTopY + 8}" rx="${g.neckW / 3}" fill="${bodyCore}"/>
    ${outfitTorso(look, g)}
    ${hairShapes(look, g)}
    <path d="${headPath(g.head)}" fill="url(#gHead)"/>
    ${poseProps(pose, g, accent)}
  `;

  // rim-light pass: the same figure painted in the accent color, offset up-left,
  // then covered by the dark body — leaving a thin luminous edge sliver.
  const rim = figure
    .replace(/fill="url\(#gHead\)"/g, `fill="${accent}"`)
    .replace(/stroke-width="(\d+(\.\d+)?)"/g, (_, w) => `stroke-width="${Number(w) + 6}"`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" width="${SPRITE_W}" height="${SPRITE_H}">
  <defs>
    <linearGradient id="gHead" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#333848"/>
      <stop offset="1" stop-color="#171A23"/>
    </linearGradient>
    <linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BODY_TOP}"/>
      <stop offset="1" stop-color="${BODY_BOT}"/>
    </linearGradient>
  </defs>
  <g transform="translate(-5,-4)">${rim}</g>
  <g>${figure}</g>
</svg>`;
}

/** stable cache key for a character look + pose */
export function lookKey(look: CharacterLook, pose: Pose = 'idle'): string {
  const s = `${look.skin}|${look.hair}|${look.hairColor}|${look.outfit}|${look.outfitColor}|${look.pantsColor}|${look.glasses ? 1 : 0}|${look.age ?? 'adult'}|${pose}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `char-${h.toString(36)}`;
}
