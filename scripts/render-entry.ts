// StoryForge offline renderer entry — bundled to an IIFE and driven by
// scripts/render_video.mjs through Playwright. Uses the exact same director,
// renderer and sprite generators as the in-browser app, so the exported video
// is pixel-identical to what users see.

import type { Character } from '@/lib/types';
import { isAnimal } from '@/lib/types';
import { buildMaxRexProject, STORY_CHARACTERS } from '@/lib/story-max-rex';
import { buildTimeline, frameStateAt, type Timeline } from '@/lib/engine/director';
import { drawFrame } from '@/lib/engine/renderer';
import { ensureUniqueVoices } from '@/lib/engine/voice';
import { buildCharacterSvg, buildCharacterBackSvg, lookKey, POSE_FOR_ACTION, type Pose } from '@/lib/character-svg';
import { buildAnimalSvg, animalKey, variantForAction, type AnimalVariant } from '@/lib/animals';
import { getBackground } from '@/lib/backgrounds';
import { bgKey, injectCachedImage } from '@/lib/engine/images';

const characters: Record<string, Character> = Object.fromEntries(
  STORY_CHARACTERS.map((c) => [c.id, c])
);
ensureUniqueVoices(Object.values(characters));
const project = buildMaxRexProject();
let timeline: Timeline | null = null;
let canvas: HTMLCanvasElement | null = null;

function ensureImage(key: string, svg: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      injectCachedImage(key, img);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => reject(new Error(`sprite failed: ${key}`));
    img.src = url;
  });
}

async function preload(): Promise<void> {
  const tasks: Promise<void>[] = [];
  for (const shot of project.shots) {
    tasks.push(ensureImage(bgKey(shot.backgroundId), getBackground(shot.backgroundId).svg()));
  }
  const poses = new Set<Pose>(['idle', 'walkA', 'walkB']);
  for (const shot of project.shots) {
    for (const b of shot.beats) {
      const p = POSE_FOR_ACTION[b.action];
      if (p) poses.add(p);
    }
  }
  for (const ch of STORY_CHARACTERS) {
    if (isAnimal(ch)) {
      const variants = new Set<AnimalVariant>(['idle']);
      for (const shot of project.shots) {
        for (const b of shot.beats) {
          if (b.characterId === ch.id) variants.add(variantForAction(b.action));
        }
      }
      for (const v of variants) {
        tasks.push(ensureImage(animalKey(ch.species ?? 'dog', ch.look.skin, v), buildAnimalSvg(ch.species ?? 'dog', ch.look.skin, v)));
      }
    } else {
      for (const p of poses) {
        tasks.push(ensureImage(lookKey(ch.look, p), buildCharacterSvg(ch.look, p)));
        // back view for turn-aways / walk-offs
        tasks.push(ensureImage(lookKey(ch.look, p, 'back'), buildCharacterBackSvg(ch.look, p)));
      }
    }
  }
  await Promise.all(tasks);
}

const api = {
  async init(audioDurations: Record<string, number>) {
    timeline = buildTimeline(project, characters, audioDurations);
    await preload();
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    document.body.appendChild(canvas);
    return {
      totalMs: timeline.totalMs,
      cues: timeline.audio.map((a) => ({
        beatId: a.beatId,
        text: a.text,
        startMs: a.startMs,
        durMs: a.durMs,
        characterId: a.characterId,
      })),
    };
  },
  frame(tMs: number) {
    if (!timeline || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fs = frameStateAt(project, characters, timeline, tMs);
    drawFrame(ctx, fs);
  },
};

// expose for the Node driver (IIFE bundle)
declare global {
  interface Window {
    __sfRender: typeof api;
  }
}
window.__sfRender = api;
