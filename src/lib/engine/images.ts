import type { AnimalVariant } from '@/lib/animals';
import { buildAnimalSvg, animalKey, variantForAction } from '@/lib/animals';
import type { Character, Project } from '@/lib/types';
import { isAnimal } from '@/lib/types';
import { buildCharacterSvg, lookKey, POSE_FOR_ACTION, type Pose } from '@/lib/character-svg';
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

/** Register an externally-created image (offline renderer) */
export function injectCachedImage(key: string, img: HTMLImageElement): void {
  cache.set(key, img);
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

export async function ensureCharacterImage(character: Character, pose: Pose = 'idle'): Promise<HTMLImageElement> {
  return ensureImage(lookKey(character.look, pose), buildCharacterSvg(character.look, pose));
}

export async function ensureAnimalImage(
  character: Character,
  variant: AnimalVariant = 'idle'
): Promise<HTMLImageElement> {
  const species = character.species ?? 'dog';
  return ensureImage(animalKey(species, character.look.skin, variant), buildAnimalSvg(species, character.look.skin, variant));
}

export async function ensureCharacterAny(character: Character): Promise<void> {
  if (isAnimal(character)) {
    await ensureAnimalImage(character, 'idle');
    return;
  }
  await ensureCharacterImage(character, 'idle');
}

export async function ensureBackgroundImage(id: string): Promise<HTMLImageElement> {
  return ensureImage(bgKey(id), getBackground(id).svg());
}

/** Preload every background + character sprite (incl. poses/variants) used by a project */
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
      if (!ch || seenChars.has(ch.id)) continue;
      seenChars.add(ch.id);
      if (isAnimal(ch)) {
        const variants = new Set<AnimalVariant>(['idle'] as AnimalVariant[]);
        for (const b of shot.beats) {
          if (b.characterId === ch.id || b.targetId === c.id) variants.add(variantForAction(b.action));
        }
        for (const v of variants) tasks.push(ensureAnimalImage(ch, v).catch(() => undefined));
      } else {
        const poses = new Set<Pose>(['idle', 'walkA', 'walkB']);
        for (const b of shot.beats) {
          const p = POSE_FOR_ACTION[b.action];
          if (p) poses.add(p);
        }
        for (const p of poses) tasks.push(ensureCharacterImage(ch, p).catch(() => undefined));
      }
    }
  }
  await Promise.all(tasks);
}
