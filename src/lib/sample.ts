import type { Character, Project, Shot } from '@/lib/types';
import { uid } from '@/lib/types';
import { buildMaxRexProject, STORY_CHARACTERS } from '@/lib/story-max-rex';

export function makeCharacter(partial: Partial<Character> & { name: string }): Character {
  return {
    id: uid(),
    kind: partial.kind ?? 'human',
    species: partial.species,
    look: {
      skin: '#F2C879',
      hair: 'short',
      hairColor: '#1E1E24',
      outfit: 'tee',
      outfitColor: '#0F9D8C',
      pantsColor: '#3A3F4A',
      glasses: false,
      age: 'adult',
      ...(partial.look ?? {}),
    },
    voice: { voiceURI: '', rate: 1, pitch: 1, ...(partial.voice ?? {}) },
    name: partial.name,
  };
}

export function emptyShot(): Shot {
  return {
    id: uid(),
    kind: 'scene',
    backgroundId: 'living-room',
    camera: 'wide',
    transition: 'fade',
    title: '',
    subtitle: '',
    cast: [],
    beats: [],
  };
}

export function newProject(name = 'Untitled story'): Project {
  const now = Date.now();
  return { id: uid(), name, createdAt: now, updatedAt: now, shots: [emptyShot()] };
}

/** Demo cast + story that ships with the app */
export function seedCharacters(): Character[] {
  return STORY_CHARACTERS.map((c) => ({ ...c, look: { ...c.look }, voice: { ...c.voice } }));
}

export function seedProject(): Project {
  return buildMaxRexProject();
}

/** Legacy signature kept for compatibility */
export function seedProjectWith(characters: Character[]): Project {
  void characters;
  return buildMaxRexProject();
}
