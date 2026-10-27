import type { AnimalSpecies } from '@/lib/types';

// ---------------------------------------------------------------------------
// Animal sprites v3 — soft-3D cartoon fur with radial shading, belly light,
// expressive eyes and per-variant posing (idle / vocal / moving).
// `accent` is the fur base color chosen by the user.
// ---------------------------------------------------------------------------

export type AnimalVariant = 'idle' | 'bark' | 'run' | 'sit' | 'wag';

export const ANIMAL_SPRITE_W: Record<AnimalSpecies, number> = {
  dog: 420,
  cat: 340,
  bird: 240,
};

export const ANIMAL_SPRITE_H: Record<AnimalSpecies, number> = {
  dog: 300,
  cat: 280,
  bird: 260,
};

/** On-canvas draw height per species (adults are 440) */
export const ANIMAL_DRAW_H: Record<AnimalSpecies, number> = {
  dog: 195,
  cat: 150,
  bird: 105,
};

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function clamp(c: number): number {
  return Math.max(0, Math.min(255, Math.round(c)));
}

export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${clamp(r + amt)},${clamp(g + amt)},${clamp(b + amt)})`;
}

function tint(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => clamp(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

const OUTLINE = 'rgba(50,36,26,0.4)';

interface FurPalette {
  base: string; hi: string; lo: string; belly: string;
  eye: string; nose: string; innerEar: string;
}

function furPalette(accent: string): FurPalette {
  return {
    base: accent,
    hi: tint(accent, 0.4),
    lo: shade(accent, -42),
    belly: tint(accent, 0.62),
    eye: '#3A2A1C',
    nose: '#4A3428',
    innerEar: 'rgba(226,140,140,0.65)',
  };
}

function furDefs(id: string, p: FurPalette): string {
  return `
    <radialGradient id="gFur${id}" cx="0.36" cy="0.3" r="0.95">
      <stop offset="0" stop-color="${p.hi}"/>
      <stop offset="0.55" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.lo}"/>
    </radialGradient>
    <linearGradient id="gLeg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.lo}"/>
    </linearGradient>`;
}

const furFill = (id: string) => `url(#gFur${id})`;
const legStroke = (id: string) => `url(#gLeg${id})`;

/** a 3-stroke cylindrical leg + paw */
function leg(id: string, x1: number, y1: number, x2: number, y2: number, w: number, p: FurPalette): string {
  return `
    <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${p.lo}" stroke-width="${w}" stroke-linecap="round" fill="none" transform="translate(1.5,1.5)"/>
    <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${legStroke(id)}" stroke-width="${w}" stroke-linecap="round" fill="none"/>
    <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${p.hi}" stroke-width="${Math.max(3, w * 0.32)}" stroke-linecap="round" fill="none" transform="translate(-1.3,-1.8)" opacity="0.6"/>`;
}

/** glossy cartoon eye with catchlights */
function animalEye(x: number, y: number, r: number, p: FurPalette, blink = false): string {
  if (blink) {
    return `<path d="M ${x - r * 1.3} ${y} Q ${x} ${y + r} ${x + r * 1.3} ${y}" stroke="${p.eye}" stroke-width="${r * 0.5}" fill="none" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="${x}" cy="${y}" r="${r}" fill="#FDFCF8"/>
    <circle cx="${x + r * 0.12}" cy="${y + r * 0.06}" r="${r * 0.62}" fill="${p.eye}"/>
    <circle cx="${x - r * 0.14}" cy="${y - r * 0.2}" r="${r * 0.2}" fill="#FFFFFF"/>
    <circle cx="${x + r * 0.34}" cy="${y + r * 0.3}" r="${r * 0.1}" fill="rgba(255,255,255,0.75)"/>`;
}

// ---------------------------------------------------------------- dog

function dogSvg(accent: string, v: AnimalVariant): string {
  const W = ANIMAL_SPRITE_W.dog;
  const H = ANIMAL_SPRITE_H.dog;
  const p = furPalette(accent);
  const earY = v === 'bark' ? 52 : 66;
  const tailLift = v === 'wag' || v === 'bark' ? -46 : -18;
  const frontLegX = v === 'run' ? 262 : 250;
  const backLegX = v === 'run' ? 138 : 152;
  const mouthOpen = v === 'bark';

  const core = `
    <!-- tail -->
    <path d="M 96 172 C 62 ${172 + tailLift * 0.4} 52 ${172 + tailLift} 66 ${172 + tailLift * 1.35}"
          stroke="${p.lo}" stroke-width="23" stroke-linecap="round" fill="none" transform="translate(2,2)"/>
    <path d="M 96 172 C 62 ${172 + tailLift * 0.4} 52 ${172 + tailLift} 66 ${172 + tailLift * 1.35}"
          stroke="${legStroke('D')}" stroke-width="21" stroke-linecap="round" fill="none"/>
    <!-- far legs -->
    ${leg('D', backLegX + 26, 198, backLegX + 18, 268, 23, p)}
    ${leg('D', frontLegX + 30, 194, frontLegX + 24, 268, 23, p)}
    <!-- body -->
    <ellipse cx="196" cy="164" rx="104" ry="58" fill="${furFill('D')}" stroke="${OUTLINE}" stroke-width="2"/>
    <ellipse cx="176" cy="196" rx="64" ry="30" fill="${p.belly}" opacity="0.75"/>
    <ellipse cx="150" cy="140" rx="46" ry="20" fill="rgba(255,255,255,0.3)"/>
    <!-- chest to head connector -->
    <path d="M 272 142 Q 306 122 318 116 L 330 148 Q 300 158 280 170 Z" fill="${p.base}"/>
    <!-- near legs -->
    ${leg('D', backLegX, 196, backLegX - (v === 'run' ? 20 : 0), 268, 23, p)}
    ${leg('D', frontLegX, 196, frontLegX + (v === 'run' ? 22 : 0), 268, 23, p)}
    <!-- head -->
    <circle cx="330" cy="112" r="47" fill="${furFill('D')}" stroke="${OUTLINE}" stroke-width="2"/>
    <ellipse cx="316" cy="94" rx="20" ry="12" fill="rgba(255,255,255,0.3)"/>
    <!-- snout -->
    <ellipse cx="372" cy="126" rx="26" ry="18" fill="${p.belly}" stroke="${OUTLINE}" stroke-width="1.4"/>
    <circle cx="392" cy="118" r="8" fill="${p.nose}"/>
    <circle cx="389" cy="115" r="2.6" fill="rgba(255,255,255,0.7)"/>
    ${mouthOpen
      ? `<path d="M 356 138 Q 372 168 392 142 Q 378 152 356 138 Z" fill="#5A2828"/>
         <ellipse cx="374" cy="152" rx="9" ry="5" fill="#D9736A"/>
         <path d="M 358 132 L 366 138 L 374 132" stroke="${p.eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : `<path d="M 358 140 Q 372 148 388 140" stroke="${p.eye}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`}
    <!-- ear -->
    <path d="M 314 74 C 306 ${earY - 26} 322 ${earY - 34} 330 ${earY - 6} C 324 ${earY + 10} 316 ${earY + 14} 310 ${earY + 4} Z"
          fill="${p.lo}" stroke="${OUTLINE}" stroke-width="1.4"/>
    <path d="M 316 76 C 312 ${earY - 16} 320 ${earY - 20} 326 ${earY - 6}" stroke="${p.innerEar}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- eye -->
    ${animalEye(344, 100, 7, p, v === 'sit')}
    <!-- brow dot -->
    <circle cx="352" cy="86" r="2" fill="${p.lo}" opacity="0.8"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>${furDefs('D', p)}</defs>
  <g>${core}</g>
</svg>`;
}

// ---------------------------------------------------------------- cat

function catSvg(accent: string, v: AnimalVariant): string {
  const W = ANIMAL_SPRITE_W.cat;
  const H = ANIMAL_SPRITE_H.cat;
  const p = furPalette(accent);
  const headUp = v === 'bark' ? -12 : 0;
  const tailUp = v === 'wag' || v === 'bark' ? 1 : 0.55;
  const mouthOpen = v === 'bark';

  const core = `
    <!-- tail -->
    <path d="M 78 168 C 34 150 30 ${168 - 120 * tailUp} 66 ${168 - 150 * tailUp}"
          stroke="${p.lo}" stroke-width="19" stroke-linecap="round" fill="none" transform="translate(2,2)"/>
    <path d="M 78 168 C 34 150 30 ${168 - 120 * tailUp} 66 ${168 - 150 * tailUp}"
          stroke="${legStroke('C')}" stroke-width="17" stroke-linecap="round" fill="none"/>
    <path d="M 40 ${168 - 130 * tailUp}" stroke="${p.hi}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.5"/>
    <!-- far legs -->
    ${leg('C', 164, 192, 162, 250, 19, p)}
    ${leg('C', 238, 188, 242, 250, 19, p)}
    <!-- body -->
    <ellipse cx="188" cy="162" rx="86" ry="46" fill="${furFill('C')}" stroke="${OUTLINE}" stroke-width="2"/>
    <ellipse cx="172" cy="186" rx="52" ry="24" fill="${p.belly}" opacity="0.75"/>
    <ellipse cx="152" cy="140" rx="38" ry="16" fill="rgba(255,255,255,0.3)"/>
    <!-- near legs -->
    ${leg('C', 138, 190, 134, 250, 19, p)}
    ${leg('C', 212, 190, 216, 250, 19, p)}
    <!-- neck -->
    <path d="M 244 140 Q 262 122 272 ${118 + headUp} L 282 ${144 + headUp} Q 262 148 252 158 Z" fill="${p.base}"/>
    <!-- head -->
    <circle cx="278" cy="${112 + headUp}" r="38" fill="${furFill('C')}" stroke="${OUTLINE}" stroke-width="2"/>
    <ellipse cx="266" cy="${98 + headUp}" rx="15" ry="9" fill="rgba(255,255,255,0.3)"/>
    <!-- muzzle -->
    <ellipse cx="296" cy="${124 + headUp}" rx="16" ry="11" fill="${p.belly}"/>
    <path d="M 290 ${118 + headUp} L 302 ${118 + headUp} L 296 ${124 + headUp} Z" fill="${p.nose}"/>
    ${mouthOpen
      ? `<path d="M 288 ${130 + headUp} Q 296 ${144 + headUp} 306 ${130 + headUp}" stroke="${p.eye}" stroke-width="2.6" fill="none"/>`
      : `<path d="M 290 ${128 + headUp} Q 296 ${132 + headUp} 302 ${128 + headUp}" stroke="${p.eye}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}
    <!-- whiskers -->
    <path d="M 298 ${122 + headUp} L 318 ${118 + headUp} M 298 ${126 + headUp} L 318 ${128 + headUp}" stroke="${p.lo}" stroke-width="1.6" opacity="0.7"/>
    <!-- ears -->
    <path d="M 258 ${86 + headUp} L 252 ${54 + headUp} L 278 ${72 + headUp} Z" fill="${p.base}" stroke="${OUTLINE}" stroke-width="1.4"/>
    <path d="M 298 ${86 + headUp} L 306 ${54 + headUp} L 282 ${72 + headUp} Z" fill="${p.base}" stroke="${OUTLINE}" stroke-width="1.4"/>
    <path d="M 260 ${80 + headUp} L 257 ${62 + headUp} L 272 ${72 + headUp} Z" fill="${p.innerEar}"/>
    <path d="M 296 ${80 + headUp} L 300 ${62 + headUp} L 286 ${72 + headUp} Z" fill="${p.innerEar}"/>
    <!-- eyes -->
    <path d="M 282 ${102 + headUp} Q 288 ${96 + headUp} 294 ${102 + headUp} Q 288 ${108 + headUp} 282 ${102 + headUp} Z" fill="${p.eye}"/>
    <circle cx="288" cy="${101 + headUp}" r="1.8" fill="#FFFFFF"/>
    ${animalEye(264, 104 + headUp, 6.5, p, false)}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>${furDefs('C', p)}</defs>
  <g>${core}</g>
</svg>`;
}

// ---------------------------------------------------------------- bird

function birdSvg(accent: string, v: AnimalVariant): string {
  const W = ANIMAL_SPRITE_W.bird;
  const H = ANIMAL_SPRITE_H.bird;
  const p = furPalette(accent);
  const beakOpen = v === 'bark';
  const headUp = beakOpen ? -8 : 0;

  const core = `
    <!-- tail feathers -->
    <path d="M 84 150 L 30 ${168} L 84 172 Z" fill="${p.lo}" stroke="${OUTLINE}" stroke-width="1.6"/>
    <path d="M 84 152 L 44 164" stroke="${p.hi}" stroke-width="3" opacity="0.6"/>
    <!-- far leg -->
    ${leg('B', 148, 176, 150, 214, 6, p)}
    <!-- body -->
    <ellipse cx="136" cy="140" rx="58" ry="44" fill="${furFill('B')}" stroke="${OUTLINE}" stroke-width="2"/>
    <ellipse cx="126" cy="156" rx="34" ry="20" fill="${p.belly}" opacity="0.8"/>
    <!-- wing -->
    <path d="M 118 128 Q 148 116 164 136 Q 146 152 118 144 Z" fill="${p.lo}" stroke="${OUTLINE}" stroke-width="1.4"/>
    <path d="M 126 132 Q 144 126 156 138" stroke="${p.hi}" stroke-width="3" fill="none" opacity="0.7"/>
    <!-- near leg -->
    ${leg('B', 128, 176, 126, 214, 6, p)}
    <!-- head -->
    <circle cx="182" cy="${94 + headUp}" r="28" fill="${furFill('B')}" stroke="${OUTLINE}" stroke-width="2"/>
    <ellipse cx="172" cy="${84 + headUp}" rx="12" ry="7" fill="rgba(255,255,255,0.32)"/>
    <!-- crest -->
    <path d="M 176 ${68 + headUp} Q 182 ${56 + headUp} 190 ${66 + headUp}" stroke="${p.hi}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- beak -->
    ${beakOpen
      ? `<path d="M 208 ${88 + headUp} L 234 ${94 + headUp} L 208 ${98 + headUp} Z" fill="${p.hi}" stroke="${OUTLINE}" stroke-width="1.2"/>
         <path d="M 208 ${100 + headUp} L 228 ${108 + headUp} L 208 ${104 + headUp} Z" fill="${p.lo}"/>`
      : `<path d="M 208 ${88 + headUp} L 234 ${96 + headUp} L 208 ${104 + headUp} Z" fill="${p.hi}" stroke="${OUTLINE}" stroke-width="1.2"/>`}
    <!-- eye -->
    ${animalEye(190, 88 + headUp, 5.5, p, false)}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>${furDefs('B', p)}</defs>
  <g>${core}</g>
</svg>`;
}

export function buildAnimalSvg(species: AnimalSpecies, accent: string, variant: AnimalVariant = 'idle'): string {
  switch (species) {
    case 'cat':
      return catSvg(accent, variant);
    case 'bird':
      return birdSvg(accent, variant);
    case 'dog':
    default:
      return dogSvg(accent, variant);
  }
}

export function animalKey(species: AnimalSpecies, accent: string, variant: AnimalVariant = 'idle'): string {
  const s = `v3|${species}|${accent}|${variant}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `animal-${h.toString(36)}`;
}

/** Which sprite variant an action should display */
export function variantForAction(action: string): AnimalVariant {
  switch (action) {
    case 'bark':
    case 'meow':
      return 'bark';
    case 'wag':
      return 'wag';
    case 'run':
    case 'fetch':
      return 'run';
    case 'sit':
      return 'sit';
    default:
      return 'idle';
  }
}
