/**
 * Procedural background score (Plotagon "AUDIO" analog).
 * A tiny WebAudio loop: warm pad chords + soft arpeggio. Optionally routed
 * into a MediaStream so the video exporter can include the music track.
 */

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // C
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private running = false;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const AC: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;
      this.master.connect(lp);
      lp.connect(this.ctx.destination);
      this.streamDest = this.ctx.createMediaStreamAudioDestination();
      lp.connect(this.streamDest);
    }
    return this.ctx;
  }

  /** Start the loop. Returns a MediaStream for recording (audio track). */
  start(): MediaStream | null {
    const ctx = this.ensure();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => undefined);
    }
    if (this.running) return this.streamDest?.stream ?? null;
    this.running = true;
    // fade in
    if (this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.2);
    }
    this.tick(); // play first chord immediately
    this.timer = setInterval(() => this.tick(), 2000);
    return this.streamDest?.stream ?? null;
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const chord = CHORDS[this.step % CHORDS.length];
    const t = ctx.currentTime;
    // pad
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
    // arpeggio plucks
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
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
    }
  }

  dispose(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => undefined);
      this.ctx = null;
      this.master = null;
      this.streamDest = null;
    }
  }
}
