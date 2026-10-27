import type { BeatAction, CharacterLook } from '@/lib/types';

// ---------------------------------------------------------------------------
// StoryForge character system v3 — "soft 3D cartoon"
// Volumetric shading (radial skin gradients, cylindrical limbs, fabric
// highlights, hair sheen), realistic proportions and a 2-frame walk cycle.
// Pure SVG, no third-party assets.
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
  | 'walkA'
  | 'walkB'
  | 'walkMid'
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
      return { elbow: [sx - 8, sy + 44], hand: [sx + 38, g.head.cy + 18] };
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
      return { elbow: [sx + 18, sy + 128], hand: [sx + 64, sy + 232] };
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
    case 'walkA': // left arm swings forward, right arm back
      return { elbow: [sx - 6, sy + 46], hand: [sx + 40, sy + 104] };
    case 'walkB': // left arm swings back
      return { elbow: [sx - 20, sy + 52], hand: [sx - 30, sy + 126] };
    case 'walkMid': // passing pose — arms cross the body mid-swing
      return { elbow: [sx - 12, sy + 50], hand: [sx + 2, sy + 116] };
    case 'idle':
    default:
      return { elbow: [sx - 14, sy + 90], hand: [sx - 4, sy + 178] };
  }
}

function mirror(p: ArmPose, g: Geometry): ArmPose {
  const mx = (x: number) => 512 - x;
  void g;
  return { elbow: [mx(p.elbow[0]), p.elbow[1]], hand: [mx(p.hand[0]), p.hand[1]] };
}

// ---------------------------------------------------------------- shading kit

export function shade(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amt));
  return `rgb(${r},${g},${b})`;
}

/** Mix a color toward white (amt 0..1) — softer highlights than plain shade() */
function tint(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

const OUTLINE = 'rgba(52,38,30,0.35)';

interface Palette {
  skin: string; skinHi: string; skinLo: string;
  cloth: string; clothHi: string; clothLo: string;
  pants: string; pantsHi: string; pantsLo: string;
  hair: string; hairHi: string; hairLo: string;
  shoe: string; shoeHi: string;
}

function palette(look: CharacterLook): Palette {
  const skin = look.skin;
  return {
    skin,
    skinHi: tint(skin, 0.38),
    skinLo: shade(skin, -34),
    cloth: look.outfitColor,
    clothHi: tint(look.outfitColor, 0.3),
    clothLo: shade(look.outfitColor, -38),
    pants: look.pantsColor,
    pantsHi: tint(look.pantsColor, 0.22),
    pantsLo: shade(look.pantsColor, -34),
    hair: look.hairColor,
    hairHi: tint(look.hairColor, 0.34),
    hairLo: shade(look.hairColor, -26),
    shoe: '#4A3630',
    shoeHi: '#6B5048',
  };
}

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

/** Cylindrical limb: shadow stroke → base stroke → highlight stroke, plus a hand */
function limb(
  sx: number, sy: number, ex: number, ey: number, hx: number, hy: number,
  w: number, p: Palette, part: 'cloth' | 'skin', sleeve: boolean
): string {
  const col = part === 'cloth' ? p.cloth : p.skin;
  const hi = part === 'cloth' ? p.clothHi : p.skinHi;
  const lo = part === 'cloth' ? p.clothLo : p.skinLo;
  const d = `M ${sx} ${sy} Q ${ex} ${ey} ${hx} ${hy}`;
  const handR = w * (sleeve ? 0.5 : 0.58);
  const handFill = sleeve ? p.skin : `url(#gSkin)`;
  return `
    <path d="${d}" stroke="${lo}" stroke-width="${w}" stroke-linecap="round" fill="none" transform="translate(1.6,2)"/>
    <path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>
    <path d="${d}" stroke="${hi}" stroke-width="${Math.max(3, w * 0.34)}" stroke-linecap="round" fill="none" transform="translate(-1.4,-2.2)" opacity="0.75"/>
    <circle cx="${hx}" cy="${hy}" r="${handR}" fill="${handFill}" stroke="${OUTLINE}" stroke-width="1.4"/>
    <circle cx="${hx - handR * 0.28}" cy="${hy - handR * 0.3}" r="${handR * 0.3}" fill="rgba(255,255,255,0.4)"/>`;
}

function hairShapes(look: CharacterLook, g: Geometry, p: Palette): string {
  const c = p.hair;
  const h = g.head;
  const grad = `url(#gHair)`;
  const cap = `
    <path d="M ${h.cx - h.rx - 6} ${h.cy + h.ry * 0.1}
             C ${h.cx - h.rx - 8} ${h.cy - h.ry * 1.06} ${h.cx + h.rx + 8} ${h.cy - h.ry * 1.06} ${h.cx + h.rx + 6} ${h.cy + h.ry * 0.1}
             C ${h.cx + h.rx * 0.5} ${h.cy - h.ry * 0.5} ${h.cx - h.rx * 0.5} ${h.cy - h.ry * 0.5} ${h.cx - h.rx - 6} ${h.cy + h.ry * 0.1} Z"
          fill="${grad}" stroke="${OUTLINE}" stroke-width="1.6"/>
    <path d="M ${h.cx - h.rx * 0.55} ${h.cy - h.ry * 0.72}
             C ${h.cx - h.rx * 0.1} ${h.cy - h.ry * 0.94} ${h.cx + h.rx * 0.45} ${h.cy - h.ry * 0.9} ${h.cx + h.rx * 0.72} ${h.cy - h.ry * 0.6}"
          stroke="${p.hairHi}" stroke-width="${h.rx * 0.14}" stroke-linecap="round" fill="none" opacity="0.8"/>`;
  const back = (extra: string) => `<g>${extra}${cap}</g>`;
  switch (look.hair) {
    case 'long':
      return back(`
        <path d="M ${h.cx - h.rx - 8} ${h.cy - 10} C ${h.cx - h.rx - 18} ${g.chinY + 120} ${h.cx - h.rx - 4} ${g.chinY + 168} ${h.cx - h.rx + 14} ${g.chinY + 178}
                 L ${h.cx - h.rx + 30} ${g.chinY + 60} C ${h.cx - h.rx + 16} ${g.chinY + 6} ${h.cx - h.rx + 12} ${h.cy} ${h.cx - h.rx - 8} ${h.cy - 10} Z" fill="${grad}"/>
        <path d="M ${h.cx + h.rx + 8} ${h.cy - 10} C ${h.cx + h.rx + 18} ${g.chinY + 120} ${h.cx + h.rx + 4} ${g.chinY + 168} ${h.cx + h.rx - 14} ${g.chinY + 178}
                 L ${h.cx + h.rx - 30} ${g.chinY + 60} C ${h.cx + h.rx - 16} ${g.chinY + 6} ${h.cx + h.rx - 12} ${h.cy} ${h.cx + h.rx + 8} ${h.cy - 10} Z" fill="${grad}"/>`);
    case 'wavy':
      return back(`
        <path d="M ${h.cx - h.rx - 6} ${h.cy} C ${h.cx - h.rx - 22} ${g.chinY + 90} ${h.cx - h.rx + 2} ${g.chinY + 130} ${h.cx - h.rx + 22} ${g.chinY + 140}
                 C ${h.cx - h.rx + 6} ${g.chinY + 70} ${h.cx - h.rx + 6} ${g.chinY + 20} ${h.cx - h.rx - 6} ${h.cy} Z" fill="${grad}"/>
        <path d="M ${h.cx + h.rx + 6} ${h.cy} C ${h.cx + h.rx + 22} ${g.chinY + 90} ${h.cx + h.rx - 2} ${g.chinY + 130} ${h.cx + h.rx - 22} ${g.chinY + 140}
                 C ${h.cx + h.rx - 6} ${g.chinY + 70} ${h.cx + h.rx - 6} ${g.chinY + 20} ${h.cx + h.rx + 6} ${h.cy} Z" fill="${grad}"/>`);
    case 'ponytail':
      return back(`
        <circle cx="${h.cx + h.rx + 16}" cy="${h.cy - 4}" r="17" fill="${p.hairLo}"/>
        <path d="M ${h.cx + h.rx + 16} ${h.cy + 10} C ${h.cx + h.rx + 44} ${g.chinY + 40} ${h.cx + h.rx + 30} ${g.chinY + 120} ${h.cx + h.rx + 8} ${g.chinY + 150}
                 C ${h.cx + h.rx + 2} ${g.chinY + 90} ${h.cx + h.rx + 2} ${g.chinY + 30} ${h.cx + h.rx + 6} ${h.cy + 16} Z" fill="${grad}"/>
        <path d="M ${h.cx + h.rx + 24} ${h.cy + 22} C ${h.cx + h.rx + 40} ${g.chinY + 50} ${h.cx + h.rx + 30} ${g.chinY + 100} ${h.cx + h.rx + 14} ${g.chinY + 130}"
              stroke="${p.hairHi}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.65"/>`);
    case 'bun':
      return back(`
        <circle cx="${h.cx}" cy="${h.cy - h.ry - 14}" r="24" fill="${grad}"/>
        <circle cx="${h.cx - 8}" cy="${h.cy - h.ry - 22}" r="8" fill="rgba(255,255,255,0.28)"/>`);
    case 'curly':
      return back(`
        <circle cx="${h.cx - h.rx + 2}" cy="${h.cy - h.ry * 0.55}" r="20" fill="${c}"/>
        <circle cx="${h.cx - h.rx * 0.45}" cy="${h.cy - h.ry - 10}" r="22" fill="${grad}"/>
        <circle cx="${h.cx + h.rx * 0.45}" cy="${h.cy - h.ry - 10}" r="22" fill="${grad}"/>
        <circle cx="${h.cx + h.rx - 2}" cy="${h.cy - h.ry * 0.55}" r="20" fill="${c}"/>
        <circle cx="${h.cx - h.rx * 0.2}" cy="${h.cy - h.ry - 14}" r="7" fill="rgba(255,255,255,0.25)"/>`);
    case 'spiky':
      return back(`
        <path d="M ${h.cx - h.rx - 3} ${h.cy - h.ry * 0.02}
                 L ${h.cx - h.rx * 0.78} ${h.cy - h.ry * 1.42}
                 L ${h.cx - h.rx * 0.42} ${h.cy - h.ry * 0.78}
                 L ${h.cx - h.rx * 0.1} ${h.cy - h.ry * 1.62}
                 L ${h.cx + h.rx * 0.22} ${h.cy - h.ry * 0.76}
                 L ${h.cx + h.rx * 0.52} ${h.cy - h.ry * 1.5}
                 L ${h.cx + h.rx * 0.8} ${h.cy - h.ry * 0.7}
                 L ${h.cx + h.rx + 3} ${h.cy - h.ry * 0.02}
                 C ${h.cx + h.rx * 0.5} ${h.cy - h.ry * 0.55} ${h.cx - h.rx * 0.55} ${h.cy - h.ry * 0.5} ${h.cx - h.rx - 3} ${h.cy - h.ry * 0.02} Z"
              fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
        <path d="M ${h.cx - h.rx * 0.66} ${h.cy - h.ry * 0.9} L ${h.cx - h.rx * 0.44} ${h.cy - h.ry * 1.18}"
              stroke="${p.hairHi}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>`);
    case 'buzz':
      return back(`
        <path d="M ${h.cx - h.rx - 2} ${h.cy + h.ry * 0.05}
                 C ${h.cx - h.rx - 2} ${h.cy - h.ry - 12} ${h.cx + h.rx + 2} ${h.cy - h.ry - 12} ${h.cx + h.rx + 2} ${h.cy + h.ry * 0.05}
                 C ${h.cx + h.rx * 0.5} ${h.cy - h.ry * 0.42} ${h.cx - h.rx * 0.5} ${h.cy - h.ry * 0.42} ${h.cx - h.rx - 2} ${h.cy + h.ry * 0.05} Z"
              fill="${c}" opacity="0.92"/>`);
    case 'short':
    default:
      return back(`
        <path d="M ${h.cx - h.rx - 3} ${h.cy - h.ry * 0.08}
                 C ${h.cx - h.rx - 5} ${h.cy - h.ry * 1.02} ${h.cx + h.rx + 5} ${h.cy - h.ry * 1.02} ${h.cx + h.rx + 3} ${h.cy - h.ry * 0.08}
                 C ${h.cx + h.rx * 0.4} ${h.cy - h.ry * 0.62} ${h.cx - h.rx * 0.55} ${h.cy - h.ry * 0.5} ${h.cx - h.rx - 3} ${h.cy - h.ry * 0.08} Z"
              fill="${grad}"/>`);
  }
}

function outfitTorso(look: CharacterLook, g: Geometry, p: Palette): string {
  const { shoulderLX: lx, shoulderRX: rx2, shoulderY: sy, hipY, torsoHalfW: tw } = g;
  const base = `M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z`;
  const grad = `url(#gCloth)`;
  // volumetric side shading + top highlight shared by all outfits
  const volume = `
    <path d="M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z" fill="url(#gShadeR)" opacity="0.5"/>
    <path d="M ${lx + 10} ${sy + 4} Q 256 ${sy - 14} ${rx2 - 14} ${sy + 6}" stroke="rgba(255,255,255,0.30)" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  switch (look.outfit) {
    case 'hoodie':
      return `
        <path d="${base}" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
        <path d="M 236 ${sy + 6} Q 256 ${sy + 2} 276 ${sy + 6} L 272 ${sy + 64} L 240 ${sy + 64} Z" fill="${p.clothLo}"/>
        <path d="M ${lx} ${sy} Q 256 ${sy - 40} ${rx2} ${sy} L ${rx2 - 6} ${sy + 26} Q 256 ${sy + 2} ${lx + 6} ${sy + 26} Z" fill="${p.cloth}" stroke="${OUTLINE}" stroke-width="1.4"/>
        <path d="M ${lx + 4} ${sy + 30} Q 256 ${sy + 6} ${rx2 - 4} ${sy + 30}" stroke="${p.clothLo}" stroke-width="4" fill="none" opacity="0.7"/>
        ${volume}`;
    case 'blazer':
      return `
        <path d="M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z" fill="url(#gShirt)" stroke="${OUTLINE}" stroke-width="1.6"/>
        <path d="M ${lx} ${sy} L ${256 - 10} ${sy + 6} L ${256 - 26} ${hipY} L ${256 - tw} ${hipY - 6} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.6"/>
        <path d="M ${rx2} ${sy} L ${256 + 10} ${sy + 6} L ${256 + 26} ${hipY} L ${256 + tw} ${hipY - 6} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.6"/>
        <path d="M ${256 - 10} ${sy + 6} L 256 ${sy + 34} L ${256 + 10} ${sy + 6} L ${256 + 4} ${sy + 4} L 256 ${sy + 12} L ${256 - 4} ${sy + 4} Z" fill="${p.clothLo}"/>
        <circle cx="256" cy="${hipY - 34}" r="4.4" fill="${p.clothHi}"/>
        ${volume}`;
    case 'dress':
      return `
        <path d="M ${lx + 6} ${sy} Q 256 ${sy - 20} ${rx2 - 6} ${sy} L ${256 + tw + 26} ${hipY + 120} Q 256 ${hipY + 142} ${256 - tw - 26} ${hipY + 120} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
        <path d="M ${lx + 6} ${sy} Q 256 ${sy - 20} ${rx2 - 6} ${sy} L ${rx2 - 10} ${sy + 24} Q 256 ${sy + 4} ${lx + 10} ${sy + 24} Z" fill="${p.clothLo}"/>
        <path d="M ${256 - tw - 8} ${hipY + 96} Q 256 ${hipY + 120} ${256 + tw + 8} ${hipY + 96}" stroke="rgba(255,255,255,0.35)" stroke-width="6" fill="none"/>
        ${volume}`;
    case 'tank':
      return `
        <path d="M ${lx + 14} ${sy + 2} Q 256 ${sy - 18} ${rx2 - 14} ${sy + 2} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
        ${volume}`;
    case 'sweater':
      return `
        <path d="M ${lx - 2} ${sy + 4} Q 256 ${sy - 20} ${rx2 + 2} ${sy + 4} L ${256 + tw + 2} ${hipY + 4} Q 256 ${hipY + 18} ${256 - tw - 2} ${hipY + 4} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
        <path d="M 238 ${sy + 2} Q 256 ${sy - 2} 274 ${sy + 2} L 274 ${sy + 26} Q 256 ${sy + 34} 238 ${sy + 26} Z" fill="${p.clothLo}"/>
        <path d="M ${256 - tw - 1} ${hipY + 2} Q 256 ${hipY + 16} ${256 + tw + 1} ${hipY + 2}" stroke="${p.clothLo}" stroke-width="5" fill="none" opacity="0.8"/>
        ${volume}`;
    case 'tee':
    default:
      return `
        <path d="${base}" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
        <path d="M 226 ${sy - 6} Q 256 ${sy + 18} 286 ${sy - 6} Q 274 ${sy + 8} 256 ${sy + 10} Q 238 ${sy + 8} 226 ${sy - 6} Z" fill="${p.skinLo}" opacity="0.8"/>
        <path d="M 232 ${sy + 2} Q 256 ${sy + 14} 280 ${sy + 2}" stroke="${p.clothLo}" stroke-width="4.5" fill="none" opacity="0.9"/>
        ${volume}`;
  }
}

/** legs with walk-cycle stride support */
function legs(look: CharacterLook, g: Geometry, pose: Pose, p: Palette): string {
  const pc = p.pants;
  const lw = Math.round(g.hipHalfW * 0.52);
  const shoe = (x: number, y: number, rot = 0) => `
    <g transform="rotate(${rot} ${x} ${y})">
      <ellipse cx="${x}" cy="${y}" rx="30" ry="14" fill="url(#gShoe)" stroke="${OUTLINE}" stroke-width="1.5"/>
      <ellipse cx="${x}" cy="${y + 7}" rx="28" ry="7" fill="${p.shoeHi}" opacity="0.55"/>
      <ellipse cx="${x - 8}" cy="${y - 6}" rx="9" ry="4.5" fill="rgba(255,255,255,0.3)"/>
    </g>`;
  const pantLeg = (x1: number, y1: number, x2: number, y2: number) => `
    <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${p.pantsLo}" stroke-width="${lw}" stroke-linecap="round" fill="none" transform="translate(1.6,1.4)"/>
    <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${pc}" stroke-width="${lw}" stroke-linecap="round" fill="none"/>
    <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${p.pantsHi}" stroke-width="${Math.max(4, lw * 0.3)}" stroke-linecap="round" fill="none" transform="translate(-1.6,-2)" opacity="0.6"/>`;

  if (pose === 'sit' || pose === 'pet') {
    const kneeY = g.hipY + 26;
    return `
      ${pantLeg(256 - 34, g.hipY, 256 + 60, kneeY)}
      ${pantLeg(256 - 10, g.hipY + 4, 256 + 82, kneeY + 10)}
      ${pantLeg(256 + 60, kneeY, 256 + 60, g.footY - 26)}
      ${pantLeg(256 + 82, kneeY + 10, 256 + 82, g.footY - 18)}
      ${shoe(256 + 74, g.footY - 10)}
      ${shoe(256 + 96, g.footY - 6)}
      <rect x="${256 - g.hipHalfW - 6}" y="${g.hipY - 18}" width="${g.hipHalfW * 2 + 12}" height="34" rx="14" fill="${pc}"/>`;
  }
  if (pose === 'walkA') {
    // contact: left leg planted forward, right leg trailing back
    const lx = 256 - g.hipHalfW + lw / 2;
    const rx2 = 256 + g.hipHalfW - lw / 2;
    return `
      ${pantLeg(rx2, g.legTopY - 12, rx2 - 38, g.footY - 26)}
      ${pantLeg(lx, g.legTopY - 12, lx + 32, g.footY - 8)}
      ${shoe(rx2 - 42, g.footY - 20, -16)}
      ${shoe(lx + 38, g.footY - 2, 7)}`;
  }
  if (pose === 'walkB') {
    const lx = 256 - g.hipHalfW + lw / 2;
    const rx2 = 256 + g.hipHalfW - lw / 2;
    return `
      ${pantLeg(lx, g.legTopY - 12, lx - 38, g.footY - 26)}
      ${pantLeg(rx2, g.legTopY - 12, rx2 + 32, g.footY - 8)}
      ${shoe(lx - 42, g.footY - 20, -16)}
      ${shoe(rx2 + 38, g.footY - 2, 7)}`;
  }
  if (pose === 'walkMid') {
    // passing: legs gather under the body, one knee lifts through
    const lx = 256 - g.hipHalfW + lw / 2;
    const rx2 = 256 + g.hipHalfW - lw / 2;
    return `
      ${pantLeg(lx, g.legTopY - 12, lx - 4, g.footY - 8)}
      ${pantLeg(rx2, g.legTopY - 12, rx2 + 10, g.footY - 30)}
      ${shoe(lx - 6, g.footY - 2, 2)}
      ${shoe(rx2 + 14, g.footY - 24, -12)}`;
  }
  const lx = 256 - g.hipHalfW + lw / 2;
  const rx2 = 256 + g.hipHalfW - lw / 2;
  return `
    ${pantLeg(lx, g.legTopY - 12, lx, g.footY - 14)}
    ${pantLeg(rx2, g.legTopY - 12, rx2, g.footY - 14)}
    ${shoe(lx, g.footY - 4)}
    ${shoe(rx2 + 6, g.footY - 4)}`;
}

/** Prop drawn as part of the pose (book, pencil, phone) */
function poseProps(pose: Pose, g: Geometry, p: Palette): string {
  switch (pose) {
    case 'read': {
      const by = g.shoulderY + 108;
      return `
        <g>
          <path d="M 196 ${by} Q 256 ${by - 18} 256 ${by - 14} Q 256 ${by - 18} 316 ${by} L 316 ${by + 66} Q 256 ${by + 48} 196 ${by + 66} Z" fill="${shade('#8C5A2E', -10)}" stroke="${OUTLINE}" stroke-width="1.6"/>
          <path d="M 204 ${by + 4} Q 256 ${by - 12} 256 ${by - 8} Q 256 ${by - 12} 308 ${by + 4} L 308 ${by + 60} Q 256 ${by + 44} 204 ${by + 60} Z" fill="#F7F0DE"/>
          <path d="M 214 ${by + 12} L 250 ${by + 8} M 214 ${by + 28} L 250 ${by + 24} M 214 ${by + 44} L 244 ${by + 40} M 262 ${by + 8} L 298 ${by + 12} M 262 ${by + 24} L 298 ${by + 28} M 268 ${by + 40} L 296 ${by + 44}" stroke="#B8A88C" stroke-width="4" stroke-linecap="round"/>
          <path d="M 256 ${by - 8} L 256 ${by + 54}" stroke="rgba(90,70,50,0.55)" stroke-width="4"/>
        </g>`;
    }
    case 'write':
      return `<line x1="${256 - 16}" y1="${g.shoulderY + 118}" x2="${256 - 4}" y2="${g.shoulderY + 150}" stroke="#E8A23E" stroke-width="7" stroke-linecap="round"/>
              <line x1="${256 - 4}" y1="${g.shoulderY + 150}" x2="${256}" y2="${g.shoulderY + 158}" stroke="#5A4632" stroke-width="7" stroke-linecap="round"/>`;
    case 'phone':
      return `<rect x="${g.shoulderLX + 30}" y="${g.head.cy + 6}" width="19" height="36" rx="5" fill="#2E323C" stroke="${OUTLINE}" stroke-width="1.4" transform="rotate(-12 ${g.shoulderLX + 39} ${g.head.cy + 24})"/>
              <rect x="${g.shoulderLX + 33}" y="${g.head.cy + 12}" width="13" height="21" rx="2.5" fill="#7FA8C9" transform="rotate(-12 ${g.shoulderLX + 39} ${g.head.cy + 24})" opacity="0.85"/>`;
    case 'give':
      return `<circle cx="256" cy="${g.shoulderY + 128}" r="17" fill="#E8B36A" stroke="${OUTLINE}" stroke-width="2" opacity="0.95"/>
              <circle cx="250" cy="${g.shoulderY + 122}" r="5" fill="rgba(255,255,255,0.5)"/>`;
    default:
      return '';
  }
  void p;
}

// ---------------------------------------------------------------- shared body

interface BodyParts {
  legs: string;
  armR: string;
  armL: string;
  neck: string;
  torso: string;
}

/**
 * Body construction shared by the front and back views.
 * Draw order fix (v3.1): BOTH arms render IN FRONT of the torso — previously
 * they were drawn behind it, so poses with hands near the body (write, read,
 * hug, give, clap, sad…) made arms disappear into the outfit.
 */
function bodyParts(look: CharacterLook, pose: Pose, g: Geometry, p: Palette): BodyParts {
  const armL = leftArm(pose, g);
  const armR = mirror(armL, g);
  const sleeveW = Math.round(g.armW * 1.12);
  const armLimb = (ap: ArmPose, side: 'L' | 'R') => {
    const sx = side === 'L' ? g.shoulderLX + 4 : 512 - (g.shoulderLX + 4);
    return limb(sx, g.shoulderY + 6, ap.elbow[0], ap.elbow[1], ap.hand[0], ap.hand[1], sleeveW, p, 'cloth', true);
  };
  return {
    legs: legs(look, g, pose, p),
    armR: armLimb(armR, 'R'),
    armL: armLimb(armL, 'L'),
    neck: `
      <rect x="${256 - g.neckW / 2}" y="${g.neckTopY}" width="${g.neckW}" height="${g.shoulderY - g.neckTopY + 10}" rx="${g.neckW / 3}" fill="url(#gNeck)"/>
      <ellipse cx="256" cy="${g.neckTopY + 5}" rx="${g.neckW * 0.62}" ry="7" fill="${p.skinLo}" opacity="0.55"/>`,
    torso: outfitTorso(look, g, p),
  };
}

/** Simplified outfit seen from behind (no lapels / pockets / neckline) */
function outfitBack(look: CharacterLook, g: Geometry, p: Palette): string {
  const { shoulderLX: lx, shoulderRX: rx2, shoulderY: sy, hipY, torsoHalfW: tw } = g;
  const base = `M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z`;
  const grad = `url(#gCloth)`;
  const volume = `
    <path d="M ${lx} ${sy} Q 256 ${sy - 22} ${rx2} ${sy} L ${256 + tw} ${hipY - 6} Q 256 ${hipY + 10} ${256 - tw} ${hipY - 6} Z" fill="url(#gShadeL)" opacity="0.5"/>
    <path d="M ${lx + 12} ${sy + 6} Q ${lx + 4} ${sy + 90} ${lx + 16} ${hipY - 10}" stroke="rgba(255,255,255,0.16)" stroke-width="6" stroke-linecap="round" fill="none"/>`;
  let detail = '';
  switch (look.outfit) {
    case 'hoodie':
      // hood hanging down the back
      detail = `<path d="M ${256 - g.neckW - 8} ${sy - 6} Q 256 ${sy + 44} ${256 + g.neckW + 8} ${sy - 6}
               Q ${256 + g.neckW - 2} ${sy + 26} 256 ${sy + 30} Q ${256 - g.neckW + 2} ${sy + 26} ${256 - g.neckW - 8} ${sy - 6} Z"
            fill="${p.clothLo}" stroke="${OUTLINE}" stroke-width="1.4"/>`;
      break;
    case 'dress':
      detail = `<path d="M ${256 - tw - 8} ${hipY + 96} Q 256 ${hipY + 120} ${256 + tw + 8} ${hipY + 96}" stroke="rgba(255,255,255,0.28)" stroke-width="5" fill="none"/>`;
      break;
    case 'sweater':
      detail = `<path d="M ${256 - tw - 1} ${hipY + 2} Q 256 ${hipY + 16} ${256 + tw + 1} ${hipY + 2}" stroke="${p.clothLo}" stroke-width="5" fill="none" opacity="0.8"/>`;
      break;
    case 'blazer':
      detail = `<path d="M 256 ${sy + 4} L 256 ${hipY - 12}" stroke="${p.clothLo}" stroke-width="3.5" opacity="0.6"/>`;
      break;
    default:
      break;
  }
  return `<path d="${base}" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>${detail}${volume}`;
}

/** Back of the head: hair fully covers the head oval, ears on the sides */
function backHead(look: CharacterLook, g: Geometry, p: Palette): string {
  const h = g.head;
  const grad = `url(#gHair)`;
  const ears = `
    <ellipse cx="${h.cx - h.rx - 3}" cy="${h.cy + h.ry * 0.12}" rx="${h.rx * 0.16}" ry="${h.rx * 0.24}" fill="url(#gSkin)" stroke="${OUTLINE}" stroke-width="1.3"/>
    <ellipse cx="${h.cx + h.rx + 3}" cy="${h.cy + h.ry * 0.12}" rx="${h.rx * 0.16}" ry="${h.rx * 0.24}" fill="url(#gSkin)" stroke="${OUTLINE}" stroke-width="1.3"/>`;
  const skull = `<path d="${headPath(h)}" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.8"/>
    <ellipse cx="${h.cx}" cy="${h.cy - h.ry * 0.28}" rx="${h.rx * 0.5}" ry="${h.ry * 0.34}" fill="rgba(255,255,255,0.14)"/>`;
  const nape = `<path d="M ${h.cx - h.rx * 0.52} ${h.cy + h.ry * 0.62}
             Q ${h.cx} ${h.cy + h.ry * 0.86} ${h.cx + h.rx * 0.52} ${h.cy + h.ry * 0.62}
             L ${h.cx + h.rx * 0.42} ${h.cy + h.ry * 1.04}
             Q ${h.cx} ${h.cy + h.ry * 1.2} ${h.cx - h.rx * 0.42} ${h.cy + h.ry * 1.04} Z" fill="${p.hairLo}" opacity="0.9"/>`;
  switch (look.hair) {
    case 'long':
      return `${ears}
        <path d="M ${h.cx - h.rx - 6} ${h.cy - h.ry * 0.5}
                 C ${h.cx - h.rx - 16} ${g.chinY + 150} ${h.cx - h.rx + 8} ${g.chinY + 190} ${h.cx} ${g.chinY + 196}
                 C ${h.cx + h.rx - 8} ${g.chinY + 190} ${h.cx + h.rx + 16} ${g.chinY + 150} ${h.cx + h.rx + 6} ${h.cy - h.ry * 0.5} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.6"/>
        ${skull}
        <path d="M ${h.cx - 10} ${h.cy} C ${h.cx - 16} ${g.chinY + 60} ${h.cx - 6} ${g.chinY + 120} ${h.cx - 2} ${g.chinY + 170}" stroke="${p.hairHi}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.5"/>`;
    case 'wavy':
      return `${ears}
        <path d="M ${h.cx - h.rx - 4} ${h.cy - h.ry * 0.4}
                 C ${h.cx - h.rx - 18} ${g.chinY + 90} ${h.cx - h.rx + 2} ${g.chinY + 140} ${h.cx} ${g.chinY + 148}
                 C ${h.cx + h.rx - 2} ${g.chinY + 140} ${h.cx + h.rx + 18} ${g.chinY + 90} ${h.cx + h.rx + 4} ${h.cy - h.ry * 0.4} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.6"/>
        ${skull}`;
    case 'ponytail':
      return `${ears}
        <circle cx="${h.cx}" cy="${h.cy - h.ry * 0.82}" r="15" fill="${p.hairLo}" stroke="${OUTLINE}" stroke-width="1.3"/>
        <path d="M ${h.cx - 8} ${h.cy - h.ry * 0.7}
                 C ${h.cx - 20} ${g.chinY + 30} ${h.cx - 14} ${g.chinY + 110} ${h.cx + 4} ${g.chinY + 150}
                 C ${h.cx + 16} ${g.chinY + 100} ${h.cx + 14} ${g.chinY + 20} ${h.cx + 8} ${h.cy - h.ry * 0.7} Z" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.5"/>
        ${skull}`;
    case 'bun':
      return `${ears}
        <circle cx="${h.cx}" cy="${h.cy - h.ry - 14}" r="24" fill="${grad}" stroke="${OUTLINE}" stroke-width="1.5"/>
        <circle cx="${h.cx - 8}" cy="${h.cy - h.ry - 22}" r="8" fill="rgba(255,255,255,0.28)"/>
        ${skull}`;
    case 'curly':
      return `${ears}
        <circle cx="${h.cx - h.rx * 0.7}" cy="${h.cy - h.ry * 0.35}" r="22" fill="${grad}"/>
        <circle cx="${h.cx + h.rx * 0.7}" cy="${h.cy - h.ry * 0.35}" r="22" fill="${grad}"/>
        <circle cx="${h.cx - h.rx * 0.55}" cy="${h.cy + h.ry * 0.35}" r="20" fill="${p.hair}"/>
        <circle cx="${h.cx + h.rx * 0.55}" cy="${h.cy + h.ry * 0.35}" r="20" fill="${p.hair}"/>
        <circle cx="${h.cx}" cy="${h.cy - h.ry * 0.85}" r="20" fill="${grad}"/>
        ${skull}
        <circle cx="${h.cx + h.rx * 0.3}" cy="${h.cy - h.ry * 0.6}" r="7" fill="rgba(255,255,255,0.22)"/>`;
    case 'spiky':
      return `${ears}
        ${skull}
        <path d="M ${h.cx - h.rx * 0.9} ${h.cy - h.ry * 0.3} L ${h.cx - h.rx * 0.7} ${h.cy - h.ry * 1.25}
                 L ${h.cx - h.rx * 0.35} ${h.cy - h.ry * 0.72} L ${h.cx} ${h.cy - h.ry * 1.4}
                 L ${h.cx + h.rx * 0.35} ${h.cy - h.ry * 0.72} L ${h.cx + h.rx * 0.7} ${h.cy - h.ry * 1.25}
                 L ${h.cx + h.rx * 0.9} ${h.cy - h.ry * 0.3}
                 C ${h.cx + h.rx * 0.4} ${h.cy - h.ry * 0.62} ${h.cx - h.rx * 0.4} ${h.cy - h.ry * 0.62} ${h.cx - h.rx * 0.9} ${h.cy - h.ry * 0.3} Z"
              fill="${grad}" stroke="${OUTLINE}" stroke-width="1.6"/>`;
    case 'buzz':
      return `${ears}${skull.replace(`stroke-width="1.8"`, `stroke-width="1.8" opacity="0.94"`)}`;
    case 'short':
    default:
      return `${ears}${skull}${nape}`;
  }
}

/** Builds the full character sprite SVG (face features are drawn by the engine) */
export function buildCharacterSvg(look: CharacterLook, pose: Pose = 'idle'): string {
  const g = geometry(look);
  const p = palette(look);
  const body = bodyParts(look, pose, g, p);
  const h = g.head;

  const head = `
    <g>
      <!-- ears -->
      <ellipse cx="${h.cx - h.rx - 3}" cy="${h.cy + h.ry * 0.12}" rx="${h.rx * 0.16}" ry="${h.rx * 0.24}" fill="url(#gSkin)" stroke="${OUTLINE}" stroke-width="1.3"/>
      <ellipse cx="${h.cx + h.rx + 3}" cy="${h.cy + h.ry * 0.12}" rx="${h.rx * 0.16}" ry="${h.rx * 0.24}" fill="url(#gSkin)" stroke="${OUTLINE}" stroke-width="1.3"/>
      <!-- face volume -->
      <path d="${headPath(h)}" fill="url(#gSkin)" stroke="${OUTLINE}" stroke-width="1.8"/>
      <!-- jaw / cheek shading -->
      <path d="M ${h.cx - h.rx * 0.72} ${h.cy + h.ry * 0.42}
               C ${h.cx - h.rx * 0.4} ${h.cy + h.ry * 0.88} ${h.cx + h.rx * 0.4} ${h.cy + h.ry * 0.88} ${h.cx + h.rx * 0.72} ${h.cy + h.ry * 0.42}"
            stroke="${p.skinLo}" stroke-width="${h.rx * 0.1}" stroke-linecap="round" fill="none" opacity="0.35"/>
      <!-- forehead highlight -->
      <ellipse cx="${h.cx - h.rx * 0.3}" cy="${h.cy - h.ry * 0.5}" rx="${h.rx * 0.42}" ry="${h.ry * 0.2}" fill="rgba(255,255,255,0.28)"/>
    </g>`;

  const figure = `
    ${body.legs}
    ${body.neck}
    ${body.torso}
    ${body.armR}
    ${body.armL}
    ${hairShapes(look, g, p)}
    ${head}
    ${poseProps(pose, g, p)}
  `;

  return characterSvgShell(p, figure);
}

/** Back-view sprite: same body, hair covers the whole head, no face features */
export function buildCharacterBackSvg(look: CharacterLook, pose: Pose = 'idle'): string {
  const g = geometry(look);
  const p = palette(look);
  const body = bodyParts(look, pose, g, p);
  const figure = `
    ${body.legs}
    ${body.armR}
    ${body.neck}
    ${outfitBack(look, g, p)}
    ${body.armL}
    ${backHead(look, g, p)}
  `;
  return characterSvgShell(p, figure);
}

/** Shared SVG wrapper (gradient defs + viewport) for both views */
function characterSvgShell(p: Palette, figure: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" width="${SPRITE_W}" height="${SPRITE_H}">
  <defs>
    <radialGradient id="gSkin" cx="0.38" cy="0.28" r="0.95">
      <stop offset="0" stop-color="${p.skinHi}"/>
      <stop offset="0.52" stop-color="${p.skin}"/>
      <stop offset="1" stop-color="${p.skinLo}"/>
    </radialGradient>
    <linearGradient id="gNeck" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skinLo}"/>
      <stop offset="0.6" stop-color="${p.skin}"/>
      <stop offset="1" stop-color="${p.skinHi}"/>
    </linearGradient>
    <linearGradient id="gCloth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.clothHi}"/>
      <stop offset="0.45" stop-color="${p.cloth}"/>
      <stop offset="1" stop-color="${p.clothLo}"/>
    </linearGradient>
    <linearGradient id="gShirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2EEE6"/>
      <stop offset="1" stop-color="#C9C2B4"/>
    </linearGradient>
    <linearGradient id="gHair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.hairHi}"/>
      <stop offset="0.5" stop-color="${p.hair}"/>
      <stop offset="1" stop-color="${p.hairLo}"/>
    </linearGradient>
    <linearGradient id="gShoe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.shoeHi}"/>
      <stop offset="1" stop-color="${p.shoe}"/>
    </linearGradient>
    <linearGradient id="gShadeR" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(40,26,20,0)"/>
      <stop offset="1" stop-color="rgba(40,26,20,0.35)"/>
    </linearGradient>
    <linearGradient id="gShadeL" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="rgba(40,26,20,0)"/>
      <stop offset="1" stop-color="rgba(40,26,20,0.35)"/>
    </linearGradient>
  </defs>
  <g>${figure}</g>
</svg>`;
}

/** Character sprite view used by the cache key */
export type SpriteView = 'front' | 'back';

/** stable cache key for a character look + pose + view */
export function lookKey(look: CharacterLook, pose: Pose = 'idle', view: SpriteView = 'front'): string {
  const s = `v3.1|${look.skin}|${look.hair}|${look.hairColor}|${look.outfit}|${look.outfitColor}|${look.pantsColor}|${look.glasses ? 1 : 0}|${look.irisColor ?? ''}|${look.age ?? 'adult'}|${pose}|${view}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `char-${h.toString(36)}`;
}
