import type { CharacterLook } from '@/lib/types';

// Sprite geometry (shared with the canvas face renderer)
export const SPRITE_W = 512;
export const SPRITE_H = 768;
export const HEAD_CX = 256;
export const HEAD_CY = 150;
export const HEAD_RX = 78;
export const HEAD_RY = 86;

/** Height (px) a character occupies when drawn on the 1280x720 canvas */
export const DRAW_H = 440;
export const SPRITE_SCALE = DRAW_H / SPRITE_H; // ≈ 0.573

const INK = 'rgba(0,0,0,0.16)';

function shade(hex: string, amt: number): string {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + amt));
  return `rgb(${r},${g},${b})`;
}

function hairBack(l: CharacterLook): string {
  const c = l.hairColor;
  const dark = shade(c, -24);
  switch (l.hair) {
    case 'long':
      return `
        <rect x="160" y="112" width="44" height="200" rx="20" fill="${c}"/>
        <rect x="308" y="112" width="44" height="200" rx="20" fill="${c}"/>
        <ellipse cx="256" cy="120" rx="88" ry="74" fill="${c}"/>`;
    case 'wavy':
      return `
        <ellipse cx="256" cy="120" rx="88" ry="74" fill="${c}"/>
        <path d="M164 130 q-16 90 8 170 q16 40 44 34 q-20 -100 -4 -190 Z" fill="${c}"/>
        <path d="M348 130 q16 90 -8 170 q-16 40 -44 34 q20 -100 4 -190 Z" fill="${c}"/>
        <circle cx="204" cy="330" r="20" fill="${dark}"/>
        <circle cx="308" cy="330" r="20" fill="${dark}"/>`;
    case 'ponytail':
      return `
        <ellipse cx="256" cy="120" rx="88" ry="74" fill="${c}"/>
        <circle cx="344" cy="168" r="28" fill="${dark}"/>
        <path d="M346 186 Q400 240 386 340 Q378 376 346 366 Q372 270 330 216 Z" fill="${c}"/>`;
    case 'bun':
      return `
        <ellipse cx="256" cy="120" rx="88" ry="74" fill="${c}"/>
        <circle cx="256" cy="46" r="36" fill="${c}"/>
        <circle cx="256" cy="46" r="36" fill="none" stroke="${dark}" stroke-width="4"/>`;
    case 'curly':
      return `
        <ellipse cx="256" cy="118" rx="86" ry="70" fill="${c}"/>
        <circle cx="182" cy="92" r="28" fill="${c}"/><circle cx="224" cy="66" r="30" fill="${c}"/>
        <circle cx="288" cy="66" r="30" fill="${c}"/><circle cx="330" cy="92" r="28" fill="${c}"/>
        <circle cx="170" cy="136" r="24" fill="${dark}"/><circle cx="342" cy="136" r="24" fill="${dark}"/>`;
    case 'spiky':
      return `
        <path d="M168 122 L194 56 L226 100 L256 42 L288 100 L320 56 L346 122 Q256 56 168 122 Z" fill="${c}"/>
        <ellipse cx="256" cy="116" rx="84" ry="66" fill="${c}"/>`;
    case 'buzz':
      return `<ellipse cx="256" cy="112" rx="82" ry="58" fill="${c}" opacity="0.9"/>`;
    case 'short':
    default:
      return `<ellipse cx="256" cy="118" rx="86" ry="70" fill="${c}"/>`;
  }
}

function hairFront(l: CharacterLook): string {
  const c = l.hairColor;
  if (l.hair === 'buzz') return '';
  return `<path d="M176 124 Q256 62 336 124 Q318 84 256 80 Q194 84 176 124 Z" fill="${shade(c, 16)}"/>`;
}

function outfitLayer(l: CharacterLook): { torso: string; sleeve: string } {
  const c = l.outfitColor;
  const dark = shade(c, -22);
  switch (l.outfit) {
    case 'hoodie':
      return {
        torso: `
          <path d="M196 252 Q256 232 316 252 Q340 262 336 292 L336 296 Q256 274 176 296 L176 292 Q172 262 196 252 Z" fill="${dark}"/>
          <path d="M176 272 Q256 250 336 272 L352 470 Q256 488 160 470 Z" fill="${c}"/>
          <rect x="206" y="392" width="100" height="56" rx="12" fill="${dark}"/>
          <path d="M244 286 L240 330 M268 286 L272 330" stroke="#F2EFE8" stroke-width="6" stroke-linecap="round"/>`,
        sleeve: c,
      };
    case 'blazer':
      return {
        torso: `
          <path d="M176 272 Q256 250 336 272 L352 470 Q256 488 160 470 Z" fill="#F2EFE8"/>
          <path d="M176 268 L232 268 L216 470 L162 466 Z" fill="${c}"/>
          <path d="M336 268 L280 268 L296 470 L350 466 Z" fill="${c}"/>
          <path d="M232 268 L256 330 L244 268 Z" fill="#FFFFFF"/>
          <path d="M280 268 L256 330 L268 268 Z" fill="#FFFFFF"/>`,
        sleeve: c,
      };
    case 'dress':
      return {
        torso: `
          <path d="M184 268 Q256 246 328 268 L378 556 Q256 576 134 556 Z" fill="${c}"/>
          <path d="M184 268 Q256 246 328 268 L332 292 Q256 272 180 292 Z" fill="${dark}"/>`,
        sleeve: l.skin,
      };
    case 'tank':
      return {
        torso: `
          <path d="M196 262 Q256 248 316 262 L336 470 Q256 486 176 470 Z" fill="${c}"/>
          <path d="M196 262 L216 276 M316 262 L296 276" stroke="${c}" stroke-width="18" stroke-linecap="round"/>`,
        sleeve: l.skin,
      };
    case 'sweater':
      return {
        torso: `
          <path d="M172 276 Q256 252 340 276 L354 462 Q256 480 158 462 Z" fill="${c}"/>
          <rect x="162" y="446" width="188" height="22" rx="8" fill="${dark}"/>
          <path d="M238 262 Q256 254 274 262 L274 286 Q256 296 238 286 Z" fill="${dark}"/>`,
        sleeve: c,
      };
    case 'tee':
    default:
      return {
        torso: `
          <path d="M172 268 Q256 248 340 268 L354 462 Q256 480 158 462 Z" fill="${c}"/>
          <path d="M216 258 Q256 280 296 258 Q282 276 256 278 Q230 276 216 258 Z" fill="${shade(l.skin, -14)}"/>`,
        sleeve: c,
      };
  }
}

/** Builds the full character sprite SVG (face features are drawn by the engine) */
export function buildCharacterSvg(look: CharacterLook): string {
  const { torso, sleeve } = outfitLayer(look);
  const skinDark = shade(look.skin, -18);
  const sleeveless = look.outfit === 'tank' || look.outfit === 'dress';
  const armSleeveLen = sleeveless ? 0 : 62;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPRITE_W} ${SPRITE_H}" width="${SPRITE_W}" height="${SPRITE_H}">
  <!-- shadow catcher (drawn by canvas) -->
  <!-- back hair -->
  ${hairBack(look)}
  <!-- legs -->
  <rect x="222" y="452" width="30" height="256" rx="14" fill="${look.pantsColor}"/>
  <rect x="260" y="452" width="30" height="256" rx="14" fill="${look.pantsColor}"/>
  <rect x="214" y="690" width="46" height="30" rx="12" fill="#2B2B33"/>
  <rect x="252" y="690" width="46" height="30" rx="12" fill="#2B2B33"/>
  <!-- arms -->
  <path d="M182 292 L150 432" stroke="${look.skin}" stroke-width="30" stroke-linecap="round" fill="none"/>
  <path d="M330 292 L362 432" stroke="${look.skin}" stroke-width="30" stroke-linecap="round" fill="none"/>
  ${
    armSleeveLen > 0
      ? `<path d="M182 292 L${182 - armSleeveLen * 0.35} ${292 + armSleeveLen}" stroke="${sleeve}" stroke-width="36" stroke-linecap="round" fill="none"/>
         <path d="M330 292 L${330 + armSleeveLen * 0.35} ${292 + armSleeveLen}" stroke="${sleeve}" stroke-width="36" stroke-linecap="round" fill="none"/>`
      : ''
  }
  <circle cx="150" cy="436" r="16" fill="${look.skin}"/>
  <circle cx="362" cy="436" r="16" fill="${look.skin}"/>
  <!-- torso -->
  ${torso}
  <!-- neck -->
  <rect x="238" y="212" width="36" height="46" rx="10" fill="${look.skin}"/>
  <path d="M238 218 q18 14 36 0 l0 18 q-18 10 -36 0 Z" fill="${skinDark}" opacity="0.55"/>
  <!-- ears -->
  <circle cx="178" cy="156" r="14" fill="${look.skin}"/>
  <circle cx="334" cy="156" r="14" fill="${look.skin}"/>
  <!-- head -->
  <ellipse cx="${HEAD_CX}" cy="${HEAD_CY}" rx="${HEAD_RX}" ry="${HEAD_RY}" fill="${look.skin}"/>
  <ellipse cx="${HEAD_CX}" cy="${HEAD_CY}" rx="${HEAD_RX}" ry="${HEAD_RY}" fill="none" stroke="${INK}" stroke-width="3"/>
  <!-- hair front -->
  ${hairFront(look)}
  ${
    look.glasses
      ? `<circle cx="216" cy="150" r="27" fill="none" stroke="#3A3A44" stroke-width="6"/>
         <circle cx="296" cy="150" r="27" fill="none" stroke="#3A3A44" stroke-width="6"/>
         <line x1="243" y1="146" x2="269" y2="146" stroke="#3A3A44" stroke-width="6"/>
         <line x1="189" y1="146" x2="176" y2="150" stroke="#3A3A44" stroke-width="6"/>
         <line x1="323" y1="146" x2="334" y2="150" stroke="#3A3A44" stroke-width="6"/>`
      : ''
  }
</svg>`;
}

/** stable cache key for a character look */
export function lookKey(look: CharacterLook): string {
  const s = `${look.skin}|${look.hair}|${look.hairColor}|${look.outfit}|${look.outfitColor}|${look.pantsColor}|${look.glasses ? 1 : 0}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `char-${h.toString(36)}`;
}
