// StoryForge Studio — core domain types
// Clean-room implementation inspired by the feature teardown of commercial
// animation-story apps (see REVERSE_ENGINEERING_NOTES.md). No third-party
// code or assets are used.

export type Emotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'scared';

export type Position = 'left' | 'center' | 'right';
export type EnterType = 'none' | 'fade' | 'walkLeft' | 'walkRight';
export type BeatAction = 'none' | 'wave' | 'jump' | 'nod' | 'shake' | 'exit';
export type CameraType = 'wide' | 'closeup' | 'zoom';
export type TransitionType = 'cut' | 'fade' | 'slide';
export type HairStyle =
  | 'short'
  | 'long'
  | 'ponytail'
  | 'bun'
  | 'curly'
  | 'spiky'
  | 'buzz'
  | 'wavy';
export type OutfitStyle = 'tee' | 'hoodie' | 'blazer' | 'dress' | 'tank' | 'sweater';

export interface VoiceConfig {
  /** SpeechSynthesis voiceURI, empty string = browser default */
  voiceURI: string;
  rate: number; // 0.6 – 1.5
  pitch: number; // 0.5 – 1.6
}

export interface CharacterLook {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  outfit: OutfitStyle;
  outfitColor: string;
  pantsColor: string;
  glasses: boolean;
}

export interface Character {
  id: string;
  name: string;
  look: CharacterLook;
  voice: VoiceConfig;
}

export interface CastEntry {
  id: string;
  characterId: string;
  position: Position;
  emotion: Emotion;
  enter: EnterType;
}

export interface Beat {
  id: string;
  /** null = narrator (voice-over caption, no actor on stage) */
  characterId: string | null;
  text: string;
  /** 'inherit' uses the cast entry emotion */
  emotion: Emotion | 'inherit';
  action: BeatAction;
}

export interface Shot {
  id: string;
  kind: 'scene' | 'title';
  backgroundId: string;
  camera: CameraType;
  transition: TransitionType;
  /** title-card fields (kind === 'title') */
  title: string;
  subtitle: string;
  cast: CastEntry[];
  beats: Beat[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  shots: Shot[];
}

export const EMOTIONS: Emotion[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'surprised',
  'scared',
];

export const POSITIONS: Position[] = ['left', 'center', 'right'];

export const ACTION_LABELS: Record<BeatAction, string> = {
  none: 'None',
  wave: 'Wave',
  jump: 'Jump',
  nod: 'Nod',
  shake: 'Shake head',
  exit: 'Walk off stage',
};

export const EMOTION_LABELS: Record<Emotion, string> = {
  neutral: 'Neutral',
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  surprised: 'Surprised',
  scared: 'Scared',
};

export const HAIR_STYLES: HairStyle[] = [
  'short',
  'long',
  'ponytail',
  'bun',
  'curly',
  'spiky',
  'buzz',
  'wavy',
];

export const OUTFIT_STYLES: OutfitStyle[] = [
  'tee',
  'hoodie',
  'blazer',
  'dress',
  'tank',
  'sweater',
];

export const SKIN_TONES = [
  '#F6D3B8',
  '#EDB98A',
  '#C68B59',
  '#9C6238',
  '#7A4626',
  '#5C3317',
];

export const HAIR_COLORS = [
  '#1E1E24',
  '#3B2A1E',
  '#6B4423',
  '#A5652C',
  '#C99B5F',
  '#E4C87F',
  '#8A8A93',
  '#B5453C',
];

export const CLOTH_COLORS = [
  '#0F9D8C',
  '#D64550',
  '#7C9A3D',
  '#8E4A8E',
  '#E09F3E',
  '#54626F',
  '#A83E56',
  '#37503C',
];

export const PANTS_COLORS = [
  '#3A3F4A',
  '#5B4636',
  '#6E6E78',
  '#7A3B3B',
  '#37503C',
  '#2F3A44',
];

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Narrator voice used for beats with characterId === null */
export const NARRATOR_VOICE: VoiceConfig = { voiceURI: '', rate: 0.95, pitch: 0.9 };
