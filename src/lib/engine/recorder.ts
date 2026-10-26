/**
 * Video export: records the animation canvas (plus optional music track)
 * into a WebM/MP4 blob via MediaRecorder.
 */

type CanvasWithCapture = HTMLCanvasElement & {
  captureStream: (fps?: number) => MediaStream;
};

export function recorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype
  );
}

export function pickMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

export class VideoRecorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(private canvas: HTMLCanvasElement) {}

  start(audioStream?: MediaStream | null): void {
    const stream = (this.canvas as CanvasWithCapture).captureStream(30);
    if (audioStream) {
      for (const track of audioStream.getAudioTracks()) {
        stream.addTrack(track);
      }
    }
    const mime = pickMime();
    this.chunks = [];
    this.rec = new MediaRecorder(
      stream,
      mime ? { mimeType: mime, videoBitsPerSecond: 6_000_000 } : undefined
    );
    this.rec.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.rec.start(250);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const rec = this.rec;
      if (!rec) return reject(new Error('Recorder not started'));
      rec.onstop = () => {
        const blob = new Blob(this.chunks, { type: rec.mimeType || 'video/webm' });
        this.rec = null;
        resolve(blob);
      };
      rec.stop();
    });
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function safeFileName(name: string): string {
  return (name || 'storyforge-project').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase();
}
