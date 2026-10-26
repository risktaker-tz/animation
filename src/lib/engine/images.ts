import type { Character, Project } from '@/lib/types';
import { buildCharacterSvg, lookKey } from '@/lib/character-svg';
import { getBackground } from '@/lib/backgrounds';

/**
 * SVG-string → HTMLImageElement registry (blob URLs, same-origin → canvas
 * stays untainted so captureStream/MediaRecorder work for video export).
 */

const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

export function getCachedImage(key: string): HTMLImageElement | undefined {
  return cache.get(key);
}

export function bgKey(id: string): string {
  return `bg-${id}`;
}

export function ensureImage(key: string, svg: string): Promise<HTMLImageElement> {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(key);
  if (inflight) return inflight;

  const task = new Promise<HTMLImageElement>((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      URL.revokeObjectURL(url);
      cache.set(key, img);
      pending.delete(key);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      pending.delete(key);
      reject(new Error(`Failed to rasterize SVG asset: ${key}`));
    };
    img.src = url;
  });
  pending.set(key, task);
  return task;
}

export async function ensureCharacterImage(character: Character): Promise<HTMLImageElement> {
  return ensureImage(lookKey(character.look), buildCharacterSvg(character.look));
}

export async function ensureBackgroundImage(id: string): Promise<HTMLImageElement> {
  return ensureImage(bgKey(id), getBackground(id).svg());
}

/** Preload every background + character sprite used by a project */
export async function preloadProjectAssets(
  project: Project,
  characters: Record<string, Character>
): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  const seenChars = new Set<string>();
  for (const shot of project.shots) {
    tasks.push(ensureBackgroundImage(shot.backgroundId).catch(() => undefined));
    for (const c of shot.cast) {
      const ch = characters[c.characterId];
      if (ch && !seenChars.has(ch.id)) {
        seenChars.add(ch.id);
        tasks.push(ensureCharacterImage(ch).catch(() => undefined));
      }
    }
  }
  await Promise.all(tasks);
}
