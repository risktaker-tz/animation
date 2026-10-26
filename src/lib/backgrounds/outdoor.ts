import type { BackgroundDef } from './index';

const svgWrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

function buildingRow(colors: string[], yBase = 560) {
  let out = '';
  const widths = [150, 110, 170, 130, 160, 120, 180];
  let x = -20;
  widths.forEach((w, i) => {
    const h = 200 + ((i * 53) % 160);
    const c = colors[i % colors.length];
    out += `<rect x="${x}" y="${yBase - h}" width="${w}" height="${h}" fill="${c}"/>`;
    for (let wy = yBase - h + 24; wy < yBase - 30; wy += 46) {
      for (let wx = x + 18; wx < x + w - 30; wx += 42) {
        out += `<rect x="${wx}" y="${wy}" width="20" height="26" fill="rgba(255,255,255,0.55)"/>`;
      }
    }
    x += w + 14;
  });
  return out;
}

export const cityDay: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FD0E8"/><stop offset="1" stop-color="#C9EAF2"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#dsky)"/>
  <circle cx="1120" cy="110" r="56" fill="#F7D154"/>
  <circle cx="1120" cy="110" r="80" fill="#F7D154" opacity="0.3"/>
  <ellipse cx="240" cy="110" rx="90" ry="30" fill="#fff" opacity="0.9"/>
  <ellipse cx="320" cy="130" rx="70" ry="24" fill="#fff" opacity="0.8"/>
  <ellipse cx="640" cy="90" rx="80" ry="26" fill="#fff" opacity="0.7"/>
  ${buildingRow(['#C98A6B', '#A8B4A0', '#B87A6A', '#9AA5B0', '#C0A575', '#8FA08E'])}
  <rect y="560" width="1280" height="160" fill="#5A5F66"/>
  <rect y="560" width="1280" height="10" fill="#484C52"/>
  <line x1="0" y1="640" x2="1280" y2="640" stroke="#E8E4D8" stroke-width="8" stroke-dasharray="60 40"/>
  <rect x="60" y="500" width="26" height="70" fill="#4A4E54"/>
  <circle cx="73" cy="488" r="16" fill="#E8E4D8"/>
  <path d="M73 500 q46 -20 60 6" stroke="#4A4E54" stroke-width="6" fill="none"/>
  <ellipse cx="900" cy="690" rx="130" ry="20" fill="#6A7078"/>
  <rect x="850" y="640" width="46" height="34" rx="4" fill="#C25B4E"/>
  `);

export const cityNight: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#141226"/><stop offset="1" stop-color="#2E2A4A"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#nsky)"/>
  <circle cx="1090" cy="120" r="46" fill="#F2EFC4"/>
  <circle cx="1074" cy="106" r="40" fill="#141226" opacity="0.35"/>
  <circle cx="150" cy="80" r="3" fill="#fff"/><circle cx="260" cy="140" r="2.5" fill="#fff"/>
  <circle cx="420" cy="70" r="3" fill="#fff"/><circle cx="540" cy="120" r="2" fill="#fff"/>
  <circle cx="700" cy="60" r="2.5" fill="#fff"/><circle cx="860" cy="100" r="3" fill="#fff"/>
  <circle cx="950" cy="60" r="2" fill="#fff"/><circle cx="1210" cy="200" r="2.5" fill="#fff"/>
  ${buildingRow(['#232036', '#2A2640', '#1E1C30', '#302C4A', '#26223A'])}
  ${buildingRow(['#2A2640', '#232036', '#302C4A', '#1E1C30'])}
  <rect y="560" width="1280" height="160" fill="#1A1826"/>
  <rect y="560" width="1280" height="8" fill="#3A3654"/>
  <line x1="0" y1="640" x2="1280" y2="640" stroke="#C9B45A" stroke-width="8" stroke-dasharray="60 44" opacity="0.8"/>
  <rect x="330" y="430" width="150" height="40" rx="6" fill="#D6457A" opacity="0.85"/>
  <rect x="620" y="400" width="120" height="36" rx="6" fill="#0F9D8C" opacity="0.85"/>
  <rect x="60" y="500" width="26" height="70" fill="#26243A"/>
  <circle cx="73" cy="488" r="15" fill="#F2EFC4"/>
  <path d="M73 500 q46 -20 60 6" stroke="#26243A" stroke-width="6" fill="none"/>
  `);

export const park: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="psky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9ED8E0"/><stop offset="1" stop-color="#D2ECE4"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#psky)"/>
  <circle cx="150" cy="100" r="46" fill="#F7D154" opacity="0.9"/>
  <ellipse cx="480" cy="90" rx="90" ry="26" fill="#fff" opacity="0.85"/>
  <ellipse cx="1020" cy="120" rx="100" ry="30" fill="#fff" opacity="0.75"/>
  <ellipse cx="220" cy="250" rx="80" ry="60" fill="#6FA05C"/>
  <rect x="204" y="290" width="32" height="120" rx="10" fill="#6E4F36"/>
  <ellipse cx="420" cy="210" rx="100" ry="74" fill="#7FAE68"/>
  <rect x="402" y="260" width="36" height="150" rx="10" fill="#5E422C"/>
  <ellipse cx="1080" cy="230" rx="110" ry="80" fill="#5C9450"/>
  <rect x="1062" y="286" width="36" height="124" rx="10" fill="#6E4F36"/>
  <ellipse cx="880" cy="470" rx="200" ry="50" fill="#7FBFD4"/>
  <rect y="540" width="1280" height="180" fill="#8FBF6E"/>
  <ellipse cx="880" cy="470" rx="200" ry="50" fill="#8AC4D8"/>
  <ellipse cx="880" cy="480" rx="150" ry="34" fill="#7FBFD4"/>
  <path d="M0 620 Q400 560 660 640 T1280 620 L1280 720 L0 720 Z" fill="#C9B078"/>
  <rect x="760" y="380" width="14" height="110" fill="#6E4F36"/>
  <rect x="880" y="380" width="14" height="110" fill="#6E4F36"/>
  <rect x="740" y="380" width="154" height="16" rx="8" fill="#8A5A3C"/>
  <rect x="740" y="420" width="154" height="14" rx="7" fill="#8A5A3C"/>
  <ellipse cx="300" cy="660" rx="60" ry="12" fill="#C25B4E"/>
  <ellipse cx="300" cy="654" rx="60" ry="12" fill="#D97C6C"/>
  `);

export const beach: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FCEE0"/><stop offset="1" stop-color="#D8F0EA"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2E9D9A"/><stop offset="1" stop-color="#59C2B4"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bsky)"/>
  <circle cx="180" cy="110" r="54" fill="#F7D154"/>
  <ellipse cx="560" cy="100" rx="100" ry="28" fill="#fff" opacity="0.85"/>
  <ellipse cx="980" cy="140" rx="90" ry="26" fill="#fff" opacity="0.7"/>
  <rect y="300" width="1280" height="200" fill="url(#sea)"/>
  <path d="M0 300 q80 16 160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0" stroke="#BFEAE0" stroke-width="8" fill="none" opacity="0.8"/>
  <path d="M0 380 q80 14 160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0" stroke="#BFEAE0" stroke-width="6" fill="none" opacity="0.5"/>
  <path d="M0 500 Q320 460 640 500 T1280 500 L1280 720 L0 720 Z" fill="#F2DCA8"/>
  <ellipse cx="640" cy="520" rx="220" ry="26" fill="#fff" opacity="0.7"/>
  <path d="M1060 300 q-10 -120 30 -180 M1090 120 q-60 10 -80 60 M1090 120 q66 6 84 56 M1090 120 q-8 -50 20 -80" stroke="#8A5A3C" stroke-width="14" fill="none" stroke-linecap="round"/>
  <ellipse cx="1000" cy="190" rx="60" ry="24" fill="#4E8A4A" transform="rotate(-24 1000 190)"/>
  <ellipse cx="1180" cy="180" rx="62" ry="24" fill="#4E8A4A" transform="rotate(22 1180 180)"/>
  <ellipse cx="1090" cy="96" rx="54" ry="22" fill="#5C9A56"/>
  <circle cx="320" cy="620" r="26" fill="#F2C879"/>
  <path d="M294 620 a26 26 0 0 1 52 0" fill="#E8A85C"/>
  <rect x="560" y="560" width="120" height="14" rx="6" fill="#C25B4E"/>
  <line x1="620" y1="560" x2="620" y2="480" stroke="#C25B4E" stroke-width="8"/>
  `);

export const stage: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <radialGradient id="spot" cx="0.5" cy="0.18" r="0.9">
      <stop offset="0" stop-color="#4A3A5C"/><stop offset="0.55" stop-color="#241C33"/><stop offset="1" stop-color="#151020"/>
    </radialGradient>
    <linearGradient id="curtL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6E1F33"/><stop offset="1" stop-color="#8E2A40"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#spot)"/>
  <path d="M0 0 H200 Q160 240 190 720 L0 720 Z" fill="url(#curtL)"/>
  <path d="M1280 0 H1080 Q1120 240 1090 720 L1280 720 Z" fill="url(#curtL)"/>
  <path d="M200 0 H1080 Q1040 150 1060 120 Q980 210 900 130 Q820 220 740 140 Q660 230 580 140 Q500 220 420 140 Q340 210 260 130 Q240 160 200 0 Z" fill="#8E2A40"/>
  <ellipse cx="640" cy="640" rx="420" ry="56" fill="#000" opacity="0.5"/>
  <ellipse cx="640" cy="300" rx="260" ry="330" fill="#F2E3C4" opacity="0.07"/>
  <circle cx="640" cy="640" r="180" fill="#F2E3C4" opacity="0.06"/>
  `);

export const sunsetHill: BackgroundDef['svg'] = () =>
  svgWrap(`
  <defs>
    <linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4A2C4E"/><stop offset="0.5" stop-color="#C25B5E"/><stop offset="1" stop-color="#F2B45C"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#ssky)"/>
  <circle cx="640" cy="430" r="90" fill="#F7DFA0"/>
  <circle cx="640" cy="430" r="130" fill="#F7DFA0" opacity="0.25"/>
  <path d="M0 470 Q320 400 640 460 T1280 450 L1280 720 L0 720 Z" fill="#5C3A54"/>
  <path d="M0 540 Q360 480 720 540 T1280 530 L1280 720 L0 720 Z" fill="#3E2A40"/>
  <ellipse cx="260" cy="140" rx="80" ry="20" fill="#E8A0A0" opacity="0.5"/>
  <ellipse cx="980" cy="180" rx="100" ry="24" fill="#E8A0A0" opacity="0.4"/>
  <ellipse cx="180" cy="470" rx="90" ry="56" fill="#2E2036"/>
  <rect x="168" y="500" width="24" height="70" fill="#241A2C"/>
  <path d="M0 610 L1280 610" stroke="#241A2C" stroke-width="4" opacity="0.4"/>
  <path d="M1000 520 l0 -40 M1000 480 l-26 -18 M1000 480 l26 -18 M1000 500 l-22 12 M1000 500 l22 12" stroke="#241A2C" stroke-width="6" stroke-linecap="round"/>
  <circle cx="1040" cy="430" r="4" fill="#241A2C"/>
  `);
