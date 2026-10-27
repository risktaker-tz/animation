/**
 * Procedural background score (Plotagon "AUDIO" analog).
 * A tiny WebAudio loop: warm pad chords + soft arpeggio.
 * Routes into the shared master audio graph so video export captures
 * voice + music + SFX together.
 */

import { getMasterAudio } from './voice';

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // C
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];

export class MusicEngine {
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private running = false;

  /** Start the loop against the shared master graph. */
  start(): void {
    const { ctx, master } = getMasterAudio();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => undefined);
    }
    if (this.running) return;
    this.running = true;
    this.master = ctx.createGain();
    this.master.gain.value = 0.0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    this.master.connect(lp);
    lp.connect(master);
    // fade in
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.2);
    this.tick(); // play first chord immediately
    this.timer = setInterval(() => this.tick(), 2000);
  }

  private tick(): void {
    const ctx = getMasterAudio().ctx;
    if (!ctx || !this.master) return;
    const chord = CHORDS[this.step % CHORDS.length];
    const t = ctx.currentTime;
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09 / (i + 1), t + 0.4);
      g.gain.linearRampToValueAtTime(0, t + 2.05);
      osc.connect(g);
      g.connect(this.master as GainNode);
      osc.start(t);
      osc.stop(t + 2.1);
    });
    for (let n = 0; n < 4; n++) {
      const f = chord[n % chord.length] * (n >= 3 ? 2 : 1);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f * 2;
      const at = t + n * 0.5 + 0.02;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.05, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(g);
      g.connect(this.master as GainNode);
      osc.start(at);
      osc.stop(at + 0.55);
    }
    this.step++;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    if (this.master) {
      try {
        const ctx = getMasterAudio().ctx;
        this.master.gain.cancelScheduledValues(ctx.currentTime);
        this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      } catch {
        /* graph already closed */
      }
      const m = this.master;
      setTimeout(() => {
        try {
          m.disconnect();
        } catch {
          /* noop */
        }
      }, 500);
      this.master = null;
    }
  }

  dispose(): void {
    this.stop();
  }
}
