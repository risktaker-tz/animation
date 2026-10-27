import type { Character, Project } from '@/lib/types';
import {
  buildTimeline,
  frameStateAt,
  estimateMs,
  type Timeline,
} from './director';
import { preloadProjectAssets } from './images';
import {
  prefetchScript,
  resolveVoice,
  scheduleBuffers,
  resumeMasterAudio,
  playAnimalSfx,
  stopAllSpeech,
  bufferCache,
  type ScheduledAudio,
} from './voice';
import { isAnimal } from '@/lib/types';
import { drawFrame, type CastVisual } from './renderer';

export interface PlayerState {
  playing: boolean;
  shotIndex: number;
  beatId: string | null;
  progress: number; // 0..1 through the whole story
}

interface PlayerCallbacks {
  onState: (s: PlayerState) => void;
  onEnd: () => void;
}

export interface PlayerOptions {
  ttsEnabled: boolean;
  musicEnabled?: boolean;
}

/**
 * Deterministic story player.
 * The timeline is computed up-front from the (optionally pre-rendered) neural
 * voice durations, so visuals and audio stay perfectly in sync — on screen and
 * in exported video alike.
 */
export class StoryPlayer {
  private timeline: Timeline | null = null;
  private raf = 0;
  private cancelled = false;
  private running = false;
  private startClock = 0;
  private audioStop: ScheduledAudio | null = null;
  private sfxTimers: ReturnType<typeof setTimeout>[] = [];
  private state: PlayerState = { playing: false, shotIndex: 0, beatId: null, progress: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private project: Project,
    private characters: Record<string, Character>,
    private opts: PlayerOptions,
    private cbs: PlayerCallbacks
  ) {}

  isRunning(): boolean {
    return this.running;
  }

  async play(): Promise<void> {
    if (this.running) return;
    this.cancelled = false;
    this.running = true;
    this.emit({ ...this.state, playing: true });

    try {
      await preloadProjectAssets(this.project, this.characters);
      const { durations } = await this.prepareAudio();
      this.timeline = buildTimeline(this.project, this.characters, durations);
      this.startAudio(durations);
      await this.runLoop();
    } catch (e) {
      console.error('[StoryPlayer] playback failed:', e);
    }

    if (!this.cancelled) {
      this.cbs.onEnd();
    }
    this.running = false;
    this.emit({ ...this.state, playing: false });
    this.paintStaticTail();
  }

  stop(): void {
    this.cancelled = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.audioStop?.stop();
    this.audioStop = null;
    for (const t of this.sfxTimers) clearTimeout(t);
    this.sfxTimers = [];
    stopAllSpeech();
  }

  // ------------------------------------------------------------ audio

  /** Pre-render every spoken line; fall back to estimates per line. */
  private async prepareAudio(): Promise<{ durations: Record<string, number> }> {
    const durations: Record<string, number> = {};
    const lines: { beatId: string; text: string; characterId: string | null }[] = [];
    for (const shot of this.project.shots) {
      for (const beat of shot.beats) {
        if (beat.text) {
          lines.push({ beatId: beat.id, text: beat.text, characterId: beat.characterId });
        }
      }
    }
    if (!this.opts.ttsEnabled || lines.length === 0) {
      for (const l of lines) durations[l.beatId] = estimateMs(l.text);
      return { durations };
    }

    const { durations: neural } = await prefetchScript(lines, this.characters);
    // merge: use neural durations where available, estimates otherwise
    for (const l of lines) {
      durations[l.beatId] = neural[l.beatId] ?? estimateMs(l.text);
    }
    return { durations };
  }

  /** Schedule voice lines + animal SFX against the master WebAudio graph. */
  private startAudio(durations: Record<string, number>): void {
    if (!this.opts.ttsEnabled || !this.timeline) return;
    resumeMasterAudio();
    const cues: { buffer: AudioBuffer; startMs: number; gain?: number }[] = [];
    for (const cue of this.timeline.audio) {
      const ch = cue.characterId ? this.characters[cue.characterId] : null;
      const v = resolveVoice(ch);
      const key = `${v.voiceId}|${v.speed.toFixed(2)}|${v.pitchShift.toFixed(2)}|${cue.text}`;
      const buf = bufferCache.get(key);
      if (buf) cues.push({ buffer: buf, startMs: cue.startMs });
    }
    this.audioStop = cues.length ? scheduleBuffers(cues) : null;

    // animal SFX at exact offsets
    for (const shot of this.project.shots) {
      for (const beat of shot.beats) {
        if (!beat.characterId) continue;
        const ch = this.characters[beat.characterId];
        if (!ch || !isAnimal(ch)) continue;
        if (!['bark', 'meow', 'chirp'].includes(beat.action)) continue;
        const t = this.timeline.beats.find((b) => b.beatId === beat.id);
        if (!t) continue;
        const at = t.startMs + 120;
        this.sfxTimers.push(setTimeout(() => playAnimalSfx(ch.species ?? 'dog'), at));
      }
    }
  }

  // ------------------------------------------------------------ render loop

  private async runLoop(): Promise<void> {
    if (!this.timeline) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    resumeMasterAudio();
    const total = this.timeline.totalMs;
    this.startClock = performance.now();

    await new Promise<void>((resolve) => {
      const tick = () => {
        if (this.cancelled) return resolve();
        const t = performance.now() - this.startClock;
        if (t >= total) {
          this.drawEnd(ctx);
          return resolve();
        }
        this.drawAt(ctx, t);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  private lastBeatId: string | null = null;
  private lastShotIndex = -1;

  private drawAt(ctx: CanvasRenderingContext2D, t: number): void {
    if (!this.timeline) return;
    const fs = frameStateAt(this.project, this.characters, this.timeline, t);
    drawFrame(ctx, fs);
    this.trackState(t, fs);
  }

  private drawEnd(ctx: CanvasRenderingContext2D): void {
    if (!this.timeline) return;
    const fs = frameStateAt(this.project, this.characters, this.timeline, this.timeline.totalMs - 1);
    drawFrame(ctx, fs);
  }

  private trackState(t: number, fs: ReturnType<typeof frameStateAt>): void {
    if (!this.timeline) return;
    let shotIndex = this.lastShotIndex;
    for (const s of this.timeline.shots) {
      if (t >= s.startMs && t < s.endMs) {
        shotIndex = s.index;
        break;
      }
    }
    const beatId = this.currentBeatId(t);
    if (beatId !== this.lastBeatId || shotIndex !== this.lastShotIndex) {
      this.lastBeatId = beatId;
      this.lastShotIndex = shotIndex;
      this.emit({
        playing: true,
        shotIndex,
        beatId,
        progress: Math.min(1, t / this.timeline.totalMs),
      });
    }
  }

  private currentBeatId(t: number): string | null {
    if (!this.timeline) return null;
    const b = this.timeline.beats.find((x) => t >= x.startMs && t < x.endMs);
    return b?.beatId ?? null;
  }

  private emit(s: PlayerState): void {
    this.state = { ...s };
    this.cbs.onState({ ...this.state });
  }

  private paintStaticTail(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx || this.cancelled || !this.timeline) return;
    const fs = frameStateAt(this.project, this.characters, this.timeline, this.timeline.totalMs - 1);
    fs.beatText = null;
    fs.beatCharacterId = null;
    drawFrame(ctx, fs);
  }
}
