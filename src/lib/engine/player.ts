import type { Beat, Character, Project } from '@/lib/types';
import { NARRATOR_VOICE } from '@/lib/types';
import {
  drawFrame,
  restingVisuals,
  POSITION_X,
  type CastVisual,
} from './renderer';
import { preloadProjectAssets } from './images';
import { speak, estimateMs, stopAllSpeech, delay } from './tts';

export interface PlayerState {
  playing: boolean;
  shotIndex: number;
  beatId: string | null;
}

interface Anim {
  castId: string;
  kind: 'walkLeft' | 'walkRight' | 'fade' | 'exit' | 'wave' | 'jump' | 'nod' | 'shake';
  start: number;
  dur: number;
}

interface PlayerCallbacks {
  onState: (s: PlayerState) => void;
  onEnd: () => void;
}

const ENTER_MS = 1100;
const TRANSITION_MS = 620;
const EXIT_MS = 950;

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

export class StoryPlayer {
  private visuals: CastVisual[] = [];
  private base = new Map<string, { x: number; footY: number; drawH: number }>();
  private anims: Anim[] = [];
  private beatText: string | null = null;
  private beatCharacterId: string | null = null;
  private speakingCharacterId: string | null = null;
  private talkOpen = 0;
  private transitionProgress = 1;
  private cameraProgress = 1;
  private shotStartAt = 0;
  private cancelled = false;
  private running = false;
  private raf = 0;
  private currentHandle: { cancel: () => void } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private project: Project,
    private characters: Record<string, Character>,
    private opts: { ttsEnabled: boolean },
    private cbs: PlayerCallbacks
  ) {}

  isRunning(): boolean {
    return this.running;
  }

  async play(): Promise<void> {
    if (this.running) return;
    await preloadProjectAssets(this.project, this.characters);
    this.cancelled = false;
    this.running = true;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.loop(ctx);
    try {
      await this.timeline();
    } catch {
      /* timeline cancelled or errored — stop quietly */
    }
    if (!this.cancelled) {
      this.cbs.onEnd();
    }
    this.running = false;
    this.paintStaticTail();
  }

  stop(): void {
    this.cancelled = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.currentHandle?.cancel();
    this.currentHandle = null;
    stopAllSpeech();
    this.speakingCharacterId = null;
    this.anims = [];
  }

  // ------------------------------------------------------------ timeline

  private async timeline(): Promise<void> {
    const shots = this.project.shots;
    for (let si = 0; si < shots.length; si++) {
      if (this.cancelled) return;
      const shot = shots[si];
      this.emit({ playing: true, shotIndex: si, beatId: null });
      this.shotStartAt = performance.now();
      this.cameraProgress = 0;
      this.transitionProgress = shot.transition === 'cut' ? 1 : 0;
      this.beatText = null;
      this.beatCharacterId = null;
      this.visuals = restingVisuals(shot);
      this.base = new Map(
        this.visuals.map((v) => [v.castId, { x: v.x, footY: v.footY, drawH: v.drawH }])
      );
      this.anims = [];

      // entrances
      let maxEnter = 0;
      for (const entry of shot.cast) {
        if (entry.enter === 'fade') {
          this.anims.push({ castId: entry.id, kind: 'fade', start: performance.now(), dur: 550 });
          maxEnter = Math.max(maxEnter, 550);
          const v = this.visuals.find((x) => x.castId === entry.id);
          if (v) v.alpha = 0;
        } else if (entry.enter === 'walkLeft') {
          this.anims.push({ castId: entry.id, kind: 'walkLeft', start: performance.now(), dur: ENTER_MS });
          maxEnter = Math.max(maxEnter, ENTER_MS);
        } else if (entry.enter === 'walkRight') {
          this.anims.push({ castId: entry.id, kind: 'walkRight', start: performance.now(), dur: ENTER_MS });
          maxEnter = Math.max(maxEnter, ENTER_MS);
        }
      }

      await Promise.all([
        this.animate(TRANSITION_MS, (p) => {
          this.transitionProgress = p;
        }),
        delay(maxEnter),
      ]);
      if (this.cancelled) return;

      for (const beat of shot.beats) {
        if (this.cancelled) return;
        await this.playBeat(beat);
        if (this.cancelled) return;
        await delay(260);
      }
      if (this.cancelled) return;
      await delay(520);
    }
  }

  private async playBeat(beat: Beat): Promise<void> {
    this.emit({ playing: true, shotIndex: -1, beatId: beat.id });
    const now = performance.now();
    const visual = beat.characterId
      ? this.visuals.find((v) => v.characterId === beat.characterId)
      : undefined;
    const ch = beat.characterId ? this.characters[beat.characterId] : undefined;

    // per-beat emotion override
    const prevEmotion = visual?.emotion;
    if (visual && beat.emotion !== 'inherit' && beat.emotion) visual.emotion = beat.emotion;

    // beat action animation
    let actionMs = 0;
    if (beat.action === 'exit' && visual) {
      this.anims.push({ castId: visual.castId, kind: 'exit', start: now, dur: EXIT_MS });
      actionMs = EXIT_MS + 150;
    } else if (beat.action !== 'none' && beat.action !== 'exit' && visual) {
      const dur = beat.action === 'jump' ? 1150 : beat.action === 'wave' ? 1600 : 1100;
      this.anims.push({ castId: visual.castId, kind: beat.action, start: now, dur });
      actionMs = beat.action === 'wave' ? 900 : 500;
    }

    this.beatText = beat.text || null;
    this.beatCharacterId = beat.characterId;

    let waitMs = actionMs;
    if (beat.text) {
      this.speakingCharacterId = beat.characterId;
      const voice = ch ? ch.voice : NARRATOR_VOICE;
      const est = estimateMs(beat.text);
      waitMs = Math.max(waitMs, est);
      if (this.opts.ttsEnabled) {
        const handle = speak(beat.text, voice);
        this.currentHandle = handle;
        await handle.promise;
        this.currentHandle = null;
      } else {
        await delay(Math.min(est, 7000));
      }
      this.speakingCharacterId = null;
    } else {
      await delay(Math.max(350, waitMs));
      waitMs = 0;
    }
    if (waitMs > 0 && beat.text) {
      await delay(Math.max(0, actionMs - 0));
    }

    if (visual) {
      if (prevEmotion) visual.emotion = prevEmotion;
      if (beat.action === 'exit') visual.visible = false;
    }
    this.beatText = null;
    this.beatCharacterId = null;
    this.emit({ playing: true, shotIndex: -1, beatId: null });
  }

  private animate(ms: number, step: (p: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = () => {
        if (this.cancelled) return resolve();
        const p = Math.min(1, (performance.now() - start) / ms);
        step(easeOutCubic(p));
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  // ------------------------------------------------------------ frame loop

  private loop(ctx: CanvasRenderingContext2D): void {
    const tick = () => {
      if (this.cancelled) return;
      this.updateAnims();
      this.drawWithState(ctx);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private updateAnims(): void {
    const now = performance.now();
    const keep: Anim[] = [];
    for (const a of this.anims) {
      const p = Math.min(1, (now - a.start) / a.dur);
      const v = this.visuals.find((x) => x.castId === a.castId);
      const b = this.base.get(a.castId);
      if (!v || !b) continue;
      switch (a.kind) {
        case 'fade':
          v.alpha = p;
          break;
        case 'walkLeft':
        case 'walkRight': {
          const from = a.kind === 'walkLeft' ? -240 : CANVAS_OFF_RIGHT;
          v.x = b.x + (from - b.x) * (1 - easeOutCubic(p));
          v.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 5)) * 7;
          break;
        }
        case 'exit': {
          const dir = b.x >= 640 ? 1 : -1;
          const target = dir > 0 ? CANVAS_OFF_RIGHT : -240;
          v.x = b.x + (target - b.x) * p;
          v.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 4)) * 7;
          if (p >= 1) v.visible = false;
          break;
        }
        case 'wave':
          v.rotation = Math.sin(p * Math.PI * 6) * 0.09;
          break;
        case 'jump':
          v.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 2)) * 46;
          break;
        case 'nod':
          v.footY = b.footY - Math.abs(Math.sin(p * Math.PI * 3)) * 10;
          v.rotation = Math.sin(p * Math.PI * 3) * 0.035;
          break;
        case 'shake':
          v.x = b.x + Math.sin(p * Math.PI * 9) * 9 * (1 - p * 0.4);
          break;
      }
      if (p < 1 && a.kind !== 'exit') keep.push(a);
      if (a.kind === 'exit' && p < 1) keep.push(a);
    }
    this.anims = keep;

    // camera progress for slow zoom
    this.cameraProgress = Math.min(1, (now - this.shotStartAt) / 8000);

    // mouth open oscillation while speaking
    if (this.speakingCharacterId) {
      const t = now / 1000;
      this.talkOpen = 0.22 + 0.78 * Math.abs(Math.sin(t * 11.5)) * (0.6 + 0.4 * Math.sin(t * 2.7));
    } else {
      this.talkOpen = 0;
    }
  }

  private drawWithState(ctx: CanvasRenderingContext2D): void {
    drawFrame(ctx, {
      shot: this.project.shots[Math.max(0, this.state.shotIndex)] ?? this.project.shots[0],
      characters: this.characters,
      visuals: this.visuals,
      speakingCharacterId: this.speakingCharacterId,
      talkOpen: this.talkOpen,
      beatText: this.beatText,
      beatCharacterId: this.beatCharacterId,
      cameraProgress: this.cameraProgress,
      transitionProgress: this.transitionProgress,
    });
  }

  private paintStaticTail(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx || this.cancelled) return;
    const shot = this.project.shots[Math.max(0, this.state.shotIndex)];
    if (!shot) return;
    this.visuals = restingVisuals(shot);
    this.beatText = null;
    this.beatCharacterId = null;
    this.speakingCharacterId = null;
    this.transitionProgress = 1;
    this.cameraProgress = 1;
    this.drawWithState(ctx);
  }

  // ------------------------------------------------------------ state

  private state: PlayerState = { playing: false, shotIndex: 0, beatId: null };

  private emit(s: PlayerState): void {
    if (s.shotIndex >= 0) this.state = { ...this.state, shotIndex: s.shotIndex };
    this.state = { ...this.state, beatId: s.beatId, playing: s.playing };
    this.cbs.onState({ ...this.state });
  }
}

const CANVAS_OFF_RIGHT = 1520;
