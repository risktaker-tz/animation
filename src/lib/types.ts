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
export type EnterType = 'none' | 'fade' | 'walkLeft' | 'walkRight' | 'runLeft' | 'runRight';
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
export type AgeVariant = 'adult' | 'child';
export type CharacterKind = 'human' | 'animal';
export type AnimalSpecies = 'dog' | 'cat' | 'bird';

/**
 * Beat actions — the interaction vocabulary.
 * `interaction` actions involve a second cast member (beat.targetId).
 * `animal` actions are for animal actors (or humans petting/playing with them).
 */
export type BeatAction =
  // v1 (kept for backwards compatibility)
  | 'none'
  | 'wave'
  | 'jump'
  | 'nod'
  | 'shake'
  | 'exit'
  // expressive solo actions
  | 'clap'
  | 'point'
  | 'shrug'
  | 'think'
  | 'cheer'
  | 'sulk'
  | 'laugh'
  | 'cry'
  | 'gasp'
  | 'dance'
  | 'sit'
  | 'write'
  | 'read'
  | 'phone'
  | 'sneak'
  | 'run'
  | 'facepalm'
  | 'salute'
  // two-actor interactions (need targetId)
  | 'hug'
  | 'highfive'
  | 'give'
  | 'whisper'
  // animal + cross-kind interactions
  | 'pet'
  | 'fetch'
  | 'bark'
  | 'meow'
  | 'chirp'
  | 'wag';

export type ActionCategory =
  | 'basic'
  | 'expressive'
  | 'activity'
  | 'interaction'
  | 'animal';

export interface VoiceConfig {
  /** legacy Web Speech voiceURI (fallback when the neural TTS service is off) */
  voiceURI: string;
  rate: number; // 0.6 – 1.5
  pitch: number; // 0.5 – 1.6
  /** neural voice id from the open-source Kokoro bank, e.g. 'af_heart' */
  voiceId?: string;
  /** neural speaking speed 0.7 – 1.3 */
  speed?: number;
  /** playback pitch multiplier, 1.0 = none; 1.1–1.25 reads as a child voice */
  pitchShift?: number;
}

export interface CharacterLook {
  /** humans: rim-light/aura tint. animals: accent tint */
  skin: string;
  hair: HairStyle;
  hairColor: string;
  outfit: OutfitStyle;
  outfitColor: string;
  pantsColor: string;
  glasses: boolean;
  age?: AgeVariant;
}

export interface Character {
  id: string;
  name: string;
  kind?: CharacterKind; // default 'human'
  species?: AnimalSpecies; // when kind === 'animal'
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
  /** cast-entry id of the interaction partner (for two-actor actions) */
  targetId?: string | null;
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

export const ACTION_CATEGORIES: Record<ActionCategory, string> = {
  basic: 'Basic',
  expressive: 'Expressive',
  activity: 'Activity',
  interaction: 'Interaction (needs partner)',
  animal: 'Animals',
};

export const ACTION_META: Record<
  BeatAction,
  { label: string; category: ActionCategory; needsTarget?: boolean; animalOnly?: boolean }
> = {
  none: { label: 'None (just talk)', category: 'basic' },
  wave: { label: 'Wave', category: 'basic' },
  nod: { label: 'Nod', category: 'basic' },
  shake: { label: 'Shake head', category: 'basic' },
  jump: { label: 'Jump', category: 'basic' },
  exit: { label: 'Walk off stage', category: 'basic' },
  clap: { label: 'Clap hands', category: 'expressive' },
  point: { label: 'Point', category: 'expressive' },
  shrug: { label: 'Shrug', category: 'expressive' },
  think: { label: 'Think…', category: 'expressive' },
  cheer: { label: 'Cheer (arms up)', category: 'expressive' },
  sulk: { label: 'Sulk (sad droop)', category: 'expressive' },
  laugh: { label: 'Laugh', category: 'expressive' },
  cry: { label: 'Cry', category: 'expressive' },
  gasp: { label: 'Gasp', category: 'expressive' },
  facepalm: { label: 'Facepalm', category: 'expressive' },
  salute: { label: 'Salute', category: 'expressive' },
  dance: { label: 'Dance', category: 'activity' },
  sit: { label: 'Sit down', category: 'activity' },
  write: { label: 'Write / homework', category: 'activity' },
  read: { label: 'Read a book', category: 'activity' },
  phone: { label: 'Phone call', category: 'activity' },
  sneak: { label: 'Sneak (tiptoe)', category: 'activity' },
  run: { label: 'Run in place', category: 'activity' },
  hug: { label: 'Hug partner', category: 'interaction', needsTarget: true },
  highfive: { label: 'High-five partner', category: 'interaction', needsTarget: true },
  give: { label: 'Give / receive gift', category: 'interaction', needsTarget: true },
  whisper: { label: 'Whisper to partner', category: 'interaction', needsTarget: true },
  pet: { label: 'Pet an animal', category: 'animal', needsTarget: true },
  fetch: { label: 'Throw ball (fetch)', category: 'animal', needsTarget: true },
  bark: { label: 'Bark!', category: 'animal', animalOnly: true },
  meow: { label: 'Meow!', category: 'animal', animalOnly: true },
  chirp: { label: 'Chirp!', category: 'animal', animalOnly: true },
  wag: { label: 'Wag tail', category: 'animal', animalOnly: true },
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

/** Rim-light / aura palette (replaces flat skin tones in the silhouette look) */
export const SKIN_TONES = [
  '#F2C879',
  '#E8A15D',
  '#D98E4A',
  '#C97B45',
  '#8FB8D9',
  '#7FD9C0',
  '#C9A3D9',
  '#D97B7B',
];

export const HAIR_COLORS = [
  '#20222C',
  '#2E241C',
  '#4A3320',
  '#6B4423',
  '#94643B',
  '#C99B5F',
  '#6E7076',
  '#3A2E3E',
];

export const CLOTH_COLORS = [
  '#1F4E4A',
  '#4E1F2A',
  '#37421F',
  '#3A2444',
  '#4A3A1C',
  '#242E38',
  '#40242E',
  '#1F3340',
];

export const PANTS_COLORS = [
  '#23262E',
  '#2E2820',
  '#2A2A30',
  '#302323',
  '#1F2A26',
  '#20262E',
];

export const ANIMAL_ACCENTS = ['#E8B36A', '#8FB8D9', '#C9A3D9', '#7FD9C0'];

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Narrator voice used for beats with characterId === null */
export const NARRATOR_VOICE: VoiceConfig = {
  voiceURI: '',
  rate: 0.95,
  pitch: 0.9,
  voiceId: 'bm_george',
  speed: 0.92,
  pitchShift: 1,
};

export function isAnimal(ch?: Character | null): boolean {
  return ch?.kind === 'animal';
}
