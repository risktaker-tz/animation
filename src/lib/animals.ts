import type { AnimalSpecies } from '@/lib/types';

// ---------------------------------------------------------------------------
// Silhouette animal sprites — side view, cinematic duotone with rim light.
// Variants cover idle / vocal / moving poses so animals can truly act.
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

function shade(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amt));
  return `rgb(${r},${g},${b})`;
}

const FUR_TOP = '#2B2F3C';
const FUR_BOT = '#12141B';

// ---------------------------------------------------------------- dog

function dogSvg(accent: string, v: AnimalVariant): string {
  const W = ANIMAL_SPRITE_W.dog;
  const H = ANIMAL_SPRITE_H.dog;
  const body = shade('#1D212C', 0);
  const earY = v === 'bark' ? 52 : 66;
  const tailLift = v === 'wag' || v === 'bark' ? -46 : -18;
  const frontLegX = v === 'run' ? 262 : 250;
  const backLegX = v === 'run' ? 138 : 152;
  const mouthOpen = v === 'bark';

  const core = `
    <!-- tail -->
    <path d="M 96 172 C 62 ${172 + tailLift * 0.4} 52 ${172 + tailLift} 66 ${172 + tailLift * 1.35}"
          stroke="${body}" stroke-width="21" stroke-linecap="round" fill="none"/>
    <!-- legs -->
    <path d="M ${backLegX} 196 L ${backLegX - (v === 'run' ? 20 : 0)} 268" stroke="${body}" stroke-width="23" stroke-linecap="round" fill="none"/>
    <path d="M ${backLegX + 26} 198 L ${backLegX + 18} 268" stroke="${body}" stroke-width="23" stroke-linecap="round" fill="none"/>
    <path d="M ${frontLegX} 196 L ${frontLegX + (v === 'run' ? 22 : 0)} 268" stroke="${body}" stroke-width="23" stroke-linecap="round" fill="none"/>
    <path d="M ${frontLegX + 30} 194 L ${frontLegX + 24} 268" stroke="${body}" stroke-width="23" stroke-linecap="round" fill="none"/>
    <!-- body -->
    <ellipse cx="196" cy="164" rx="104" ry="58" fill="url(#gFur)"/>
    <!-- chest to head connector -->
    <path d="M 272 142 Q 306 122 318 116 L 330 148 Q 300 158 280 170 Z" fill="${body}"/>
    <!-- head -->
    <circle cx="330" cy="112" r="47" fill="url(#gFur)"/>
    <!-- snout -->
    <ellipse cx="372" cy="126" rx="26" ry="18" fill="${body}"/>
    <circle cx="392" cy="120" r="7" fill="#0A0C10"/>
    ${mouthOpen
      ? `<path d="M 356 138 Q 372 168 392 142 Q 378 152 356 138 Z" fill="#0A0C10"/>
         <path d="M 368 150 Q 378 158 386 148 L 380 144 Z" fill="#D9736A"/>`
      : `<path d="M 358 140 Q 372 148 388 140" stroke="#0A0C10" stroke-width="4" fill="none" stroke-linecap="round"/>`}
    <!-- ear -->
    <path d="M 314 74 C 306 ${earY - 26} 322 ${earY - 34} 330 ${earY - 6} C 324 ${earY + 10} 316 ${earY + 14} 310 ${earY + 4} Z" fill="${body}"/>
    <!-- eye -->
    <circle cx="344" cy="100" r="6.5" fill="${accent}"/>
    <circle cx="346" cy="98" r="2.2" fill="#FFFFFF" opacity="0.9"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="gFur" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${FUR_TOP}"/>
      <stop offset="1" stop-color="${FUR_BOT}"/>
    </linearGradient>
  </defs>
  <g transform="translate(-5,-4)">
    <g opacity="0.95">${core}</g>
  </g>
  <g>${core}</g>
</svg>`;
}

// ---------------------------------------------------------------- cat

function catSvg(accent: string, v: AnimalVariant): string {
  const W = ANIMAL_SPRITE_W.cat;
  const H = ANIMAL_SPRITE_H.cat;
  const body = shade('#1D212C', 0);
  const headUp = v === 'bark' ? -12 : 0;
  const tailUp = v === 'wag' || v === 'bark' ? 1 : 0.55;
  const mouthOpen = v === 'bark';

  const core = `
    <!-- tail: big elegant curve -->
    <path d="M 78 168 C 34 150 30 ${168 - 120 * tailUp} 66 ${168 - 150 * tailUp}"
          stroke="${body}" stroke-width="17" stroke-linecap="round" fill="none"/>
    <!-- legs -->
    <path d="M 138 190 L 134 250" stroke="${body}" stroke-width="19" stroke-linecap="round" fill="none"/>
    <path d="M 164 192 L 162 250" stroke="${body}" stroke-width="19" stroke-linecap="round" fill="none"/>
    <path d="M 212 190 L 216 250" stroke="${body}" stroke-width="19" stroke-linecap="round" fill="none"/>
    <path d="M 238 188 L 242 250" stroke="${body}" stroke-width="19" stroke-linecap="round" fill="none"/>
    <!-- body -->
    <ellipse cx="188" cy="162" rx="86" ry="46" fill="url(#gFur2)"/>
    <!-- neck -->
    <path d="M 244 140 Q 262 122 272 ${118 + headUp} L 282 ${144 + headUp} Q 262 148 252 158 Z" fill="${body}"/>
    <!-- head -->
    <circle cx="278" cy="${112 + headUp}" r="38" fill="url(#gFur2)"/>
    <!-- ears -->
    <path d="M 258 ${86 + headUp} L 252 ${54 + headUp} L 278 ${72 + headUp} Z" fill="${body}"/>
    <path d="M 298 ${86 + headUp} L 306 ${54 + headUp} L 282 ${72 + headUp} Z" fill="${body}"/>
    ${mouthOpen
      ? `<path d="M 296 ${128 + headUp} Q 308 ${144 + headUp} 318 ${126 + headUp} Q 308 ${134 + headUp} 296 ${128 + headUp} Z" fill="#0A0C10"/>`
      : ''}
    <!-- eye -->
    <path d="M 288 ${104 + headUp} Q 294 ${98 + headUp} 300 ${104 + headUp} Q 294 ${108 + headUp} 288 ${104 + headUp} Z" fill="${accent}"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="gFur2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${FUR_TOP}"/>
      <stop offset="1" stop-color="${FUR_BOT}"/>
    </linearGradient>
  </defs>
  <g transform="translate(-5,-4)">${core}</g>
  <g>${core}</g>
</svg>`;
}

// ---------------------------------------------------------------- bird

function birdSvg(accent: string, v: AnimalVariant): string {
  const W = ANIMAL_SPRITE_W.bird;
  const H = ANIMAL_SPRITE_H.bird;
  const body = shade('#1D212C', 0);
  const beakOpen = v === 'bark';
  const headUp = beakOpen ? -8 : 0;

  const core = `
    <!-- tail feathers -->
    <path d="M 84 150 L 30 ${168} L 84 172 Z" fill="${body}"/>
    <!-- legs -->
    <path d="M 128 176 L 126 214 M 148 176 L 150 214" stroke="${accent}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <!-- body -->
    <ellipse cx="136" cy="140" rx="58" ry="44" fill="url(#gFur3)"/>
    <!-- head -->
    <circle cx="182" cy="${94 + headUp}" r="28" fill="url(#gFur3)"/>
    <!-- beak -->
    ${beakOpen
      ? `<path d="M 208 ${88 + headUp} L 234 ${94 + headUp} L 208 ${98 + headUp} Z" fill="${accent}"/>
         <path d="M 208 ${100 + headUp} L 228 ${108 + headUp} L 208 ${104 + headUp} Z" fill="${shade(accent, -40)}"/>`
      : `<path d="M 208 ${88 + headUp} L 234 ${96 + headUp} L 208 ${104 + headUp} Z" fill="${accent}"/>`}
    <!-- wing hint -->
    <path d="M 118 128 Q 148 118 162 136 Q 140 148 118 142 Z" fill="${body}"/>
    <!-- eye -->
    <circle cx="190" cy="${88 + headUp}" r="5" fill="${accent}"/>
    <circle cx="192" cy="${86 + headUp}" r="1.8" fill="#FFFFFF" opacity="0.9"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="gFur3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${FUR_TOP}"/>
      <stop offset="1" stop-color="${FUR_BOT}"/>
    </linearGradient>
  </defs>
  <g transform="translate(-5,-4)">${core}</g>
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
  const s = `${species}|${accent}|${variant}`;
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
