import type { Character, VoiceConfig } from '@/lib/types';
import { NARRATOR_VOICE, isAnimal } from '@/lib/types';

// ---------------------------------------------------------------------------
// Voice engine v2 — open-source neural TTS (Kokoro-82M, Apache-2.0).
// Voices are served by the local micro-service (scripts/serve_tts.py) through
// /api/tts, decoded to AudioBuffers and routed through a shared WebAudio
// master graph so recordings capture voice + music + SFX together.
// Falls back to the Web Speech API / timed captions when offline.
// ---------------------------------------------------------------------------

export interface VoiceOption {
  id: string; // Kokoro voice pack id
  label: string;
  gender: 'female' | 'male';
  accent: 'American' | 'British';
  vibe: string;
}

/** Curated bank of the most natural Kokoro v1.0 voice packs */
export const VOICE_BANK: VoiceOption[] = [
  { id: 'af_heart', label: 'Heart', gender: 'female', accent: 'American', vibe: 'warm & expressive' },
  { id: 'af_bella', label: 'Bella', gender: 'female', accent: 'American', vibe: 'bright & clear' },
  { id: 'af_nicole', label: 'Nicole', gender: 'female', accent: 'American', vibe: 'soft & gentle' },
  { id: 'af_sky', label: 'Sky', gender: 'female', accent: 'American', vibe: 'youthful & lively' },
  { id: 'af_nova', label: 'Nova', gender: 'female', accent: 'American', vibe: 'polished' },
  { id: 'af_kore', label: 'Kore', gender: 'female', accent: 'American', vibe: 'confident' },
  { id: 'af_sarah', label: 'Sarah', gender: 'female', accent: 'American', vibe: 'pleasant' },
  { id: 'af_aoede', label: 'Aoede', gender: 'female', accent: 'American', vibe: 'airy' },
  { id: 'bf_emma', label: 'Emma', gender: 'female', accent: 'British', vibe: 'poised' },
  { id: 'bf_isabella', label: 'Isabella', gender: 'female', accent: 'British', vibe: 'refined' },
  { id: 'bf_alice', label: 'Alice', gender: 'female', accent: 'British', vibe: 'crisp' },
  { id: 'bf_lily', label: 'Lily', gender: 'female', accent: 'British', vibe: 'bright' },
  { id: 'am_michael', label: 'Michael', gender: 'male', accent: 'American', vibe: 'warm & grounded' },
  { id: 'am_adam', label: 'Adam', gender: 'male', accent: 'American', vibe: 'steady' },
  { id: 'am_fenrir', label: 'Fenrir', gender: 'male', accent: 'American', vibe: 'energetic' },
  { id: 'am_onyx', label: 'Onyx', gender: 'male', accent: 'American', vibe: 'deep & cinematic' },
  { id: 'am_puck', label: 'Puck', gender: 'male', accent: 'American', vibe: 'playful' },
  { id: 'am_echo', label: 'Echo', gender: 'male', accent: 'American', vibe: 'calm' },
  { id: 'am_eric', label: 'Eric', gender: 'male', accent: 'American', vibe: 'easy-going' },
  { id: 'am_liam', label: 'Liam', gender: 'male', accent: 'American', vibe: 'young & clear' },
  { id: 'bm_george', label: 'George', gender: 'male', accent: 'British', vibe: 'distinguished' },
  { id: 'bm_fable', label: 'Fable', gender: 'male', accent: 'British', vibe: 'storyteller' },
  { id: 'bm_daniel', label: 'Daniel', gender: 'male', accent: 'British', vibe: 'reassuring' },
  { id: 'bm_lewis', label: 'Lewis', gender: 'male', accent: 'British', vibe: 'upbeat' },
];

export const DEFAULT_FEMALE_VOICE = 'af_heart';
export const DEFAULT_MALE_VOICE = 'am_michael';
export const DEFAULT_NARRATOR_VOICE = 'bm_george';
export const DEFAULT_KID_BOY_VOICE = 'am_puck';
export const DEFAULT_KID_GIRL_VOICE = 'af_sky';

export interface ResolvedVoice {
  voiceId: string;
  speed: number;
  pitchShift: number;
  /** legacy Web Speech fallback config */
  web: VoiceConfig;
  /** true when this is a browser-voice fallback line */
  fallback: boolean;
}

/** Unique, gender-aware neural voice for any cast member or the narrator */
export function resolveVoice(ch?: Character | null): ResolvedVoice {
  if (!ch) {
    return {
      voiceId: NARRATOR_VOICE.voiceId || DEFAULT_NARRATOR_VOICE,
      speed: NARRATOR_VOICE.speed ?? 0.95,
      pitchShift: NARRATOR_VOICE.pitchShift ?? 1,
      web: NARRATOR_VOICE,
      fallback: false,
    };
  }
  if (isAnimal(ch)) {
    // animals "speak" through pitched-up novelty lines (Woof!/Meow!)
    const species = ch.species ?? 'dog';
    const base = species === 'bird' ? 'af_sky' : species === 'cat' ? 'af_sky' : 'am_fenrir';
    return {
      voiceId: ch.voice.voiceId || base,
      speed: ch.voice.speed ?? 1.15,
      pitchShift: ch.voice.pitchShift ?? (species === 'dog' ? 1.5 : 1.42),
      web: ch.voice,
      fallback: false,
    };
  }
  const kid = ch.look.age === 'child';
  const defaultId = kid
    ? DEFAULT_KID_BOY_VOICE
    : guessGender(ch.name) === 'female'
      ? DEFAULT_FEMALE_VOICE
      : DEFAULT_MALE_VOICE;
  return {
    voiceId: ch.voice.voiceId || defaultId,
    speed: ch.voice.speed ?? (kid ? 1.05 : 1),
    pitchShift: ch.voice.pitchShift ?? (kid ? 1.2 : 1),
    web: ch.voice,
    fallback: false,
  };
}

const FEMALE_NAMES = /^(maya|emma|mia|lily|sara|sarah|zoe|ava|nina|rosa|anna|lena|kira|mira|tara|june|ivy|mom|mother|gran|aunt|sis|whiskers)$/i;

/** Lightweight name-based guess used only when no voice was picked */
export function guessGender(name: string): 'female' | 'male' {
  if (FEMALE_NAMES.test(name.trim())) return 'female';
  return 'male';
}

const FEMALE_PREFERENCE = ['af_heart', 'af_bella', 'af_sky', 'af_nicole', 'af_nova', 'af_kore', 'af_sarah', 'af_aoede', 'bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily'];
const MALE_PREFERENCE = ['am_michael', 'am_puck', 'am_fenrir', 'am_adam', 'am_onyx', 'am_echo', 'am_eric', 'am_liam', 'bm_george', 'bm_fable', 'bm_daniel', 'bm_lewis'];

/**
 * Guarantee every speaking character has a distinct neural voice.
 * Duplicates (same voiceId) beyond the first are re-assigned deterministically
 * from the gender preference list. Mutates and returns the cast array.
 */
export function ensureUniqueVoices(characters: Character[]): Character[] {
  const speakers = characters.filter((c) => !isAnimal(c) || c.voice.voiceId);
  const used = new Set<string>();
  for (const c of speakers) {
    const current = c.voice.voiceId || resolveVoice(c).voiceId;
    if (!used.has(current)) {
      c.voice.voiceId = current;
      used.add(current);
      continue;
    }
    const prefs = guessGender(c.name) === 'female' ? FEMALE_PREFERENCE : MALE_PREFERENCE;
    const pick = prefs.find((v) => !used.has(v)) ?? prefs[0];
    c.voice.voiceId = pick;
    used.add(pick);
  }
  return characters;
}

// ---------------------------------------------------------------- audio graph

interface MasterGraph {
  ctx: AudioContext;
  master: GainNode;
  streamDest: MediaStreamAudioDestinationNode | null;
}

let graph: MasterGraph | null = null;

/** Shared WebAudio graph: everything (voice, music, sfx) mixes into `master` */
export function getMasterAudio(): MasterGraph {
  if (!graph) {
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    let streamDest: MediaStreamAudioDestinationNode | null = null;
    try {
      streamDest = ctx.createMediaStreamDestination();
      master.connect(streamDest);
    } catch {
      /* recording not supported — playback still works */
    }
    graph = { ctx, master, streamDest };
  }
  return graph;
}

export function resumeMasterAudio(): void {
  const g = getMasterAudio();
  if (g.ctx.state === 'suspended') void g.ctx.resume();
}

// ---------------------------------------------------------------- buffers

const bufferCache = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer | null>>();

export function bufferKey(text: string, voiceId: string, speed: number, pitchShift: number): string {
  return `${voiceId}|${speed.toFixed(2)}|${pitchShift.toFixed(2)}|${text}`;
}

let serviceOk: boolean | null = null;

/** Probe whether the neural TTS service is reachable */
export async function ttsServiceAvailable(): Promise<boolean> {
  if (serviceOk !== null) return serviceOk;
  try {
    const res = await fetch('/api/tts', { method: 'GET' });
    const json = (await res.json()) as { ok?: boolean };
    serviceOk = !!json.ok;
  } catch {
    serviceOk = false;
  }
  return serviceOk;
}

export function resetTtsProbe(): void {
  serviceOk = null;
}

/** Fetch + decode one neural voice line (cached). Null when unavailable. */
export async function fetchVoiceBuffer(
  text: string,
  voiceId: string,
  speed: number,
  pitchShift: number
): Promise<AudioBuffer | null> {
  const key = bufferKey(text, voiceId, speed, pitchShift);
  const hit = bufferCache.get(key);
  if (hit) return hit;
  const running = inflight.get(key);
  if (running) return running;

  const task = (async () => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceId, speed, pitch: pitchShift }),
      });
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const g = getMasterAudio();
      const buf = await g.ctx.decodeAudioData(arr);
      bufferCache.set(key, buf);
      return buf;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, task);
  return task;
}

/** Pre-fetch every line of a script; returns duration map (beatId → ms) */
export async function prefetchScript(
  lines: { beatId: string; text: string; characterId: string | null }[],
  characters: Record<string, Character>
): Promise<{ durations: Record<string, number>; allNeural: boolean }> {
  const durations: Record<string, number> = {};
  const results = await Promise.all(
    lines.map(async (l) => {
      const v = resolveVoice(l.characterId ? characters[l.characterId] : null);
      const buf = await fetchVoiceBuffer(l.text, v.voiceId, v.speed, v.pitchShift);
      return { beatId: l.beatId, buf };
    })
  );
  let allNeural = true;
  for (const r of results) {
    if (r.buf) {
      durations[r.beatId] = r.buf.duration * 1000;
    } else {
      allNeural = false;
    }
  }
  return { durations, allNeural };
}

// ---------------------------------------------------------------- playback

export interface ScheduledAudio {
  stop: () => void;
}

/** Schedule a batch of buffers at absolute timeline offsets (seconds) */
export function scheduleBuffers(
  cues: { buffer: AudioBuffer; startMs: number; gain?: number }[]
): ScheduledAudio {
  const g = getMasterAudio();
  const t0 = g.ctx.currentTime + 0.08;
  const sources: AudioBufferSourceNode[] = [];
  for (const cue of cues) {
    const src = g.ctx.createBufferSource();
    src.buffer = cue.buffer;
    const gain = g.ctx.createGain();
    gain.gain.value = cue.gain ?? 1;
    src.connect(gain).connect(g.master);
    src.start(t0 + cue.startMs / 1000);
    sources.push(src);
  }
  return {
    stop: () => {
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          /* already finished */
        }
      }
    },
  };
}

/** Fire-and-forget playback of one buffer (preview buttons) */
export function playBufferNow(buffer: AudioBuffer, gain = 1): ScheduledAudio {
  const g = getMasterAudio();
  const src = g.ctx.createBufferSource();
  src.buffer = buffer;
  const gn = g.ctx.createGain();
  gn.gain.value = gain;
  src.connect(gn).connect(g.master);
  src.start();
  return {
    stop: () => {
      try {
        src.stop();
      } catch {
        /* noop */
      }
    },
  };
}

// ---------------------------------------------------------------- SFX

/** Tiny procedural animal call used when a neural line is unavailable */
export function playAnimalSfx(species: string): void {
  const g = getMasterAudio();
  const ctx = g.ctx;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain).connect(g.master);
  if (species === 'dog') {
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  } else if (species === 'cat') {
    osc.frequency.setValueAtTime(430, t);
    osc.frequency.linearRampToValueAtTime(660, t + 0.12);
    osc.frequency.linearRampToValueAtTime(320, t + 0.34);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    osc.start(t);
    osc.stop(t + 0.38);
  } else {
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.linearRampToValueAtTime(2300, t + 0.07);
    osc.frequency.linearRampToValueAtTime(1400, t + 0.13);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.17);
  }
}

// ---------------------------------------------------------------- legacy TTS

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function estimateMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(14000, Math.max(1100, 420 + words * 330));
}

export function stopAllSpeech(): void {
  if (ttsSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }
}

export { bufferCache };
