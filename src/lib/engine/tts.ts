import type { VoiceConfig } from '@/lib/types';

/**
 * Text-to-speech engine built on the Web Speech API, with graceful fallback
 * to timed captions when the browser has no speech support (e.g. headless).
 */

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let voiceCache: SpeechSynthesisVoice[] = [];

export function listVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) voiceCache = v;
  return voiceCache;
}

if (typeof window !== 'undefined' && ttsSupported()) {
  // voices load asynchronously in most browsers
  window.speechSynthesis.onvoiceschanged = () => listVoices();
  listVoices();
}

export function estimateMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(14000, Math.max(1100, 420 + words * 330));
}

export interface SpeakHandle {
  promise: Promise<void>;
  cancel: () => void;
}

function pickVoice(uri: string): SpeechSynthesisVoice | null {
  const voices = listVoices();
  if (!voices.length) return null;
  if (uri) {
    const found = voices.find((v) => v.voiceURI === uri);
    if (found) return found;
  }
  return null;
}

/** Speak with the Web Speech API. Resolves when speech ends (or fallback timer). */
export function speak(text: string, voice: VoiceConfig): SpeakHandle {
  if (!ttsSupported()) {
    return { promise: delay(estimateMs(text)), cancel: () => undefined };
  }
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  const v = pickVoice(voice.voiceURI);
  if (v) utter.voice = v;
  utter.rate = Math.max(0.5, Math.min(2, voice.rate || 1));
  utter.pitch = Math.max(0, Math.min(2, voice.pitch || 1));
  utter.volume = 1;

  let cancelled = false;
  let done = false;
  let resolveFn: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    resolveFn = resolve;
  });

  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(guard);
    resolveFn();
  };

  utter.onend = finish;
  utter.onerror = finish;
  // hard guard: some browsers drop events on long utterances
  const guard = setTimeout(finish, estimateMs(text) * 1.8 + 2500);

  // Chrome can silently ignore speak() if the synth is paused
  if (synth.paused) synth.resume();

  try {
    synth.speak(utter);
  } catch {
    // fall back to timed caption
    return { promise: delay(estimateMs(text)), cancel: () => undefined };
  }

  return {
    promise,
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      try {
        synth.cancel();
      } catch {
        /* noop */
      }
      finish();
    },
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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
