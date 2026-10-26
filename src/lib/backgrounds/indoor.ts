import type { BackgroundDef } from './index';

/** Shared SVG scaffolding for indoor scenes */
const svgWrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

const FLOOR = '#8A6E52';
const FLOOR_DARK = '#6E563E';

export const livingRoom: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F3E2C7"/><stop offset="1" stop-color="#E7CFA8"/>
    </linearGradient>
    <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#BFE3D6"/><stop offset="1" stop-color="#8FCBB8"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#wall)"/>
  <rect y="560" width="1280" height="160" fill="${FLOOR}"/>
  <rect y="560" width="1280" height="14" fill="${FLOOR_DARK}" opacity="0.5"/>
  <rect x="120" y="90" width="300" height="240" rx="10" fill="url(#win)" stroke="#A9846A" stroke-width="14"/>
  <line x1="270" y1="90" x2="270" y2="330" stroke="#A9846A" stroke-width="8"/>
  <line x1="120" y1="210" x2="420" y2="210" stroke="#A9846A" stroke-width="8"/>
  <path d="M100 70 Q110 300 96 342 L130 342 Q140 300 132 70 Z" fill="#C96F4A"/>
  <path d="M410 70 Q400 300 414 342 L446 342 Q452 300 442 70 Z" fill="#C96F4A"/>
  <circle cx="980" cy="180" r="90" fill="#E8B14E" opacity="0.35"/>
  <rect x="700" y="150" width="380" height="230" rx="18" fill="#B7754E"/>
  <rect x="720" y="176" width="240" height="150" rx="8" fill="#3E4A44"/>
  <rect x="720" y="176" width="240" height="150" rx="8" fill="none" stroke="#2E3833" stroke-width="6"/>
  <rect x="984" y="176" width="76" height="150" rx="8" fill="#8C5A3C"/>
  <rect x="700" y="380" width="380" height="26" rx="10" fill="#9A5F3D"/>
  <circle cx="620" cy="150" r="34" fill="#E8B14E"/>
  <rect x="612" y="182" width="16" height="60" fill="#7A5C42"/>
  <rect x="560" y="238" width="120" height="16" rx="8" fill="#7A5C42"/>
  <rect x="520" y="254" width="26" height="306" fill="#6E4F36"/>
  <ellipse cx="620" cy="600" rx="220" ry="52" fill="#C25B4E"/>
  <ellipse cx="620" cy="600" rx="160" ry="34" fill="#D97C6C" opacity="0.6"/>
  <rect x="120" y="470" width="120" height="90" rx="8" fill="#A9846A"/>
  <rect x="140" y="420" width="80" height="60" rx="6" fill="#8FAE7A"/>
  <rect x="150" y="396" width="60" height="34" rx="6" fill="#7E9C6A"/>
  `);

export const bedroom: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="bwall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E8D9EE"/><stop offset="1" stop-color="#D3BCE0"/>
    </linearGradient>
    <linearGradient id="bwin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3A3A5C"/><stop offset="1" stop-color="#5C5A80"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bwall)"/>
  <rect y="560" width="1280" height="160" fill="#9C7B5E"/>
  <rect y="560" width="1280" height="12" fill="#7E6248" opacity="0.6"/>
  <circle cx="200" cy="140" r="34" fill="#F2E39A"/>
  <rect x="180" y="150" width="40" height="52" rx="8" fill="#B08968"/>
  <rect x="860" y="90" width="260" height="200" rx="10" fill="url(#bwin)" stroke="#8A6E9C" stroke-width="12"/>
  <line x1="990" y1="90" x2="990" y2="290" stroke="#8A6E9C" stroke-width="6"/>
  <circle cx="940" cy="150" r="26" fill="#F4EFC4" opacity="0.9"/>
  <circle cx="1040" cy="120" r="3" fill="#fff"/><circle cx="1080" cy="180" r="3" fill="#fff"/>
  <circle cx="1000" cy="230" r="2.5" fill="#fff"/><circle cx="1090" cy="250" r="2" fill="#fff"/>
  <rect x="120" y="330" width="150" height="110" rx="10" fill="#E8B14E"/>
  <rect x="140" y="352" width="110" height="66" rx="6" fill="#7A5C8E"/>
  <rect x="60" y="440" width="460" height="130" rx="22" fill="#C97BA0"/>
  <rect x="60" y="404" width="460" height="58" rx="26" fill="#E39AB8"/>
  <rect x="90" y="416" width="180" height="40" rx="18" fill="#F6D8E4"/>
  <rect x="560" y="360" width="120" height="200" rx="12" fill="#B08968"/>
  <rect x="548" y="330" width="144" height="42" rx="10" fill="#9C7350"/>
  <circle cx="700" cy="300" r="30" fill="#E8B14E" opacity="0.4"/>
  <rect x="960" y="420" width="180" height="26" rx="12" fill="#8A6E9C"/>
  <rect x="1000" y="380" width="34" height="46" rx="8" fill="#C25B4E"/>
  <rect x="1050" y="392" width="26" height="34" rx="8" fill="#0F9D8C"/>
  `);

export const classroom: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="cwall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E7E2D3"/><stop offset="1" stop-color="#D6CFBA"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#cwall)"/>
  <rect y="540" width="1280" height="180" fill="#B99B72"/>
  <rect y="540" width="1280" height="12" fill="#96794F" opacity="0.6"/>
  <rect x="330" y="90" width="620" height="300" rx="14" fill="#3E5C48" stroke="#7A5C3A" stroke-width="16"/>
  <path d="M420 180 q40 -50 80 0 t80 0 t80 0" fill="none" stroke="#E8E4D0" stroke-width="6" stroke-linecap="round"/>
  <path d="M430 250 q60 -36 120 0 t120 0 t100 0" fill="none" stroke="#E8E4D0" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
  <rect x="352" y="360" width="80" height="16" rx="6" fill="#C9A96A"/>
  <circle cx="1100" cy="140" r="52" fill="#F7F3E8" stroke="#8A7A5A" stroke-width="8"/>
  <line x1="1100" y1="140" x2="1100" y2="104" stroke="#3A3A3A" stroke-width="6" stroke-linecap="round"/>
  <line x1="1100" y1="140" x2="1126" y2="152" stroke="#3A3A3A" stroke-width="5" stroke-linecap="round"/>
  <rect x="90" y="120" width="180" height="230" rx="8" fill="#BFE3D6" stroke="#A9846A" stroke-width="10"/>
  <line x1="90" y1="236" x2="270" y2="236" stroke="#A9846A" stroke-width="6"/>
  <rect x="60" y="470" width="1160" height="26" rx="8" fill="#C9A96A"/>
  <rect x="150" y="496" width="20" height="60" fill="#96794F"/>
  <rect x="1110" y="496" width="20" height="60" fill="#96794F"/>
  <rect x="380" y="470" width="220" height="16" rx="6" fill="#B08950"/>
  <rect x="760" y="470" width="220" height="16" rx="6" fill="#B08950"/>
  `);

export const office: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="owall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E4E7E3"/><stop offset="1" stop-color="#CFD4CD"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#owall)"/>
  <rect y="540" width="1280" height="180" fill="#7E8894"/>
  <rect y="540" width="1280" height="12" fill="#5F6A76" opacity="0.7"/>
  <rect x="80" y="70" width="340" height="380" rx="8" fill="#9FB8C4" stroke="#6A7680" stroke-width="10"/>
  <line x1="80" y1="200" x2="420" y2="200" stroke="#6A7680" stroke-width="6"/>
  <line x1="80" y1="320" x2="420" y2="320" stroke="#6A7680" stroke-width="6"/>
  <line x1="250" y1="70" x2="250" y2="450" stroke="#6A7680" stroke-width="6"/>
  <rect x="500" y="120" width="90" height="70" rx="8" fill="#C25B4E"/>
  <rect x="520" y="100" width="50" height="40" rx="6" fill="#E09F3E"/>
  <rect x="640" y="140" width="70" height="50" rx="8" fill="#0F9D8C"/>
  <rect x="740" y="110" width="80" height="80" rx="8" fill="#8E4A8E" opacity="0.85"/>
  <rect x="860" y="90" width="330" height="330" rx="12" fill="#D7DCE2" stroke="#8A94A0" stroke-width="8"/>
  <rect x="884" y="120" width="130" height="90" rx="6" fill="#54626F"/>
  <rect x="1030" y="120" width="130" height="90" rx="6" fill="#E09F3E"/>
  <rect x="884" y="230" width="276" height="16" rx="6" fill="#AEB6BE"/>
  <rect x="884" y="262" width="220" height="16" rx="6" fill="#AEB6BE"/>
  <rect x="884" y="294" width="250" height="16" rx="6" fill="#AEB6BE"/>
  <rect x="180" y="470" width="900" height="34" rx="10" fill="#54626F"/>
  <rect x="240" y="504" width="24" height="120" fill="#3E4A54"/>
  <rect x="1000" y="504" width="24" height="120" fill="#3E4A54"/>
  <rect x="300" y="430" width="150" height="44" rx="6" fill="#2E3833"/>
  <rect x="306" y="474" width="30" height="26" fill="#2E3833"/>
  <rect x="560" y="440" width="90" height="34" rx="6" fill="#3E4A54"/>
  <ellipse cx="1180" cy="600" rx="90" ry="60" fill="#0F9D8C"/>
  <path d="M1180 560 q-14 -60 24 -96 M1180 566 q-44 -36 -30 -84 M1180 570 q30 -48 6 -100" stroke="#0B7A6C" stroke-width="10" fill="none" stroke-linecap="round"/>
  `);

export const cafe: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="kwall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5C4432"/><stop offset="1" stop-color="#4A3626"/>
    </linearGradient>
    <linearGradient id="kwin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2C879"/><stop offset="1" stop-color="#D99A5B"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#kwall)"/>
  <rect y="540" width="1280" height="180" fill="#6E4F36"/>
  <rect y="540" width="1280" height="12" fill="#513A28" opacity="0.7"/>
  <rect x="90" y="80" width="290" height="300" rx="10" fill="url(#kwin)" stroke="#2E2118" stroke-width="14"/>
  <line x1="235" y1="80" x2="235" y2="380" stroke="#2E2118" stroke-width="8"/>
  <rect x="520" y="90" width="230" height="150" rx="8" fill="#3A2A1C" stroke="#C9A96A" stroke-width="6"/>
  <text x="635" y="140" font-family="Georgia, serif" font-size="42" fill="#F2E3C4" text-anchor="middle">MENU</text>
  <line x1="560" y1="165" x2="710" y2="165" stroke="#C9A96A" stroke-width="4"/>
  <line x1="560" y1="192" x2="690" y2="192" stroke="#8A7452" stroke-width="4"/>
  <line x1="560" y1="216" x2="700" y2="216" stroke="#8A7452" stroke-width="4"/>
  <circle cx="960" cy="110" r="30" fill="#E09F3E"/>
  <circle cx="960" cy="140" r="10" fill="#F2C879"/>
  <rect x="954" y="140" width="12" height="120" fill="#2E2118"/>
  <circle cx="1100" cy="110" r="30" fill="#E09F3E"/>
  <rect x="1094" y="140" width="12" height="120" fill="#2E2118"/>
  <rect x="480" y="330" width="700" height="46" rx="10" fill="#8A5A3C"/>
  <rect x="480" y="376" width="700" height="164" rx="6" fill="#6E452C"/>
  <rect x="520" y="400" width="130" height="110" rx="8" fill="#8A5A3C"/>
  <rect x="700" y="400" width="130" height="110" rx="8" fill="#8A5A3C"/>
  <rect x="880" y="400" width="130" height="110" rx="8" fill="#8A5A3C"/>
  <ellipse cx="585" cy="440" rx="40" ry="14" fill="#C9A96A"/>
  <path d="M585 470 q0 26 30 26" stroke="#C9A96A" stroke-width="8" fill="none"/>
  <rect x="120" y="470" width="240" height="24" rx="8" fill="#8A5A3C"/>
  <rect x="150" y="494" width="20" height="80" fill="#513A28"/>
  <rect x="390" y="494" width="20" height="80" fill="#513A28"/>
  <ellipse cx="255" cy="470" rx="60" ry="20" fill="#C25B4E"/>
  <rect x="245" y="420" width="20" height="46" rx="6" fill="#E8E4D0"/>
  `);

export const spaceship: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="sphull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3E4450"/><stop offset="1" stop-color="#262B36"/>
    </linearGradient>
    <radialGradient id="space" cx="0.5" cy="0.45" r="0.8">
      <stop offset="0" stop-color="#241E3E"/><stop offset="1" stop-color="#120F22"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sphull)"/>
  <rect y="560" width="1280" height="160" fill="#1C202A"/>
  <rect y="560" width="1280" height="10" fill="#4A5464" opacity="0.8"/>
  <circle cx="300" cy="240" r="170" fill="url(#space)" stroke="#6A768C" stroke-width="16"/>
  <circle cx="300" cy="240" r="170" fill="none" stroke="#9FB0C4" stroke-width="4" opacity="0.5"/>
  <circle cx="250" cy="190" r="5" fill="#fff"/><circle cx="340" cy="260" r="4" fill="#fff"/>
  <circle cx="280" cy="300" r="3" fill="#fff"/><circle cx="360" cy="170" r="3" fill="#F2C879"/>
  <circle cx="980" cy="240" r="170" fill="url(#space)" stroke="#6A768C" stroke-width="16"/>
  <circle cx="930" cy="180" r="5" fill="#fff"/><circle cx="1020" cy="280" r="4" fill="#fff"/>
  <circle cx="1010" cy="200" r="3" fill="#fff"/>
  <rect x="120" y="480" width="1040" height="26" rx="12" fill="#4A5464"/>
  <rect x="180" y="506" width="26" height="90" fill="#313848"/>
  <rect x="1074" y="506" width="26" height="90" fill="#313848"/>
  <rect x="600" y="120" width="80" height="300" rx="10" fill="#313848" stroke="#4A5464" stroke-width="4"/>
  <circle cx="640" cy="180" r="22" fill="#E09F3E"/>
  <circle cx="640" cy="250" r="22" fill="#0F9D8C"/>
  <circle cx="640" cy="320" r="22" fill="#D64550"/>
  <line x1="140" y1="90" x2="240" y2="90" stroke="#0F9D8C" stroke-width="6" stroke-linecap="round"/>
  <line x1="140" y1="110" x2="210" y2="110" stroke="#E09F3E" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
  <line x1="1040" y1="90" x2="1140" y2="90" stroke="#0F9D8C" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="640" cy="620" rx="420" ry="40" fill="#4A5464" opacity="0.35"/>
  `);
