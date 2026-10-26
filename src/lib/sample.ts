import type { Character, Project, Shot } from '@/lib/types';
import { uid } from '@/lib/types';

export function makeCharacter(partial: Partial<Character> & { name: string }): Character {
  return {
    id: uid(),
    look: {
      skin: '#C68B59',
      hair: 'short',
      hairColor: '#1E1E24',
      outfit: 'tee',
      outfitColor: '#0F9D8C',
      pantsColor: '#3A3F4A',
      glasses: false,
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

export function seedCharacters(): Character[] {
  return [
    makeCharacter({
      name: 'Maya',
      look: {
        skin: '#C68B59',
        hair: 'long',
        hairColor: '#1E1E24',
        outfit: 'dress',
        outfitColor: '#0F9D8C',
        pantsColor: '#3A3F4A',
        glasses: false,
      },
      voice: { voiceURI: '', rate: 1, pitch: 1.18 },
    }),
    makeCharacter({
      name: 'Leo',
      look: {
        skin: '#F6D3B8',
        hair: 'short',
        hairColor: '#6B4423',
        outfit: 'hoodie',
        outfitColor: '#7C9A3D',
        pantsColor: '#5B4636',
        glasses: true,
      },
      voice: { voiceURI: '', rate: 1, pitch: 0.82 },
    }),
  ];
}

export function seedProject(characters: Character[]): Project {
  const [maya, leo] = characters;
  const now = Date.now();
  const project: Project = {
    id: uid(),
    name: 'The Midnight Scoop (sample)',
    createdAt: now,
    updatedAt: now,
    shots: [
      {
        id: uid(),
        kind: 'title',
        backgroundId: 'stage',
        camera: 'wide',
        transition: 'fade',
        title: 'The Midnight Scoop',
        subtitle: 'A StoryForge short — press play',
        cast: [],
        beats: [],
      },
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'cafe',
        camera: 'wide',
        transition: 'fade',
        title: '',
        subtitle: '',
        cast: [
          { id: uid(), characterId: maya.id, position: 'left', emotion: 'happy', enter: 'walkLeft' },
          { id: uid(), characterId: leo.id, position: 'right', emotion: 'neutral', enter: 'none' },
        ],
        beats: [
          { id: uid(), characterId: maya.id, text: 'Leo! You are not going to believe what I just saw outside.', emotion: 'surprised', action: 'none' },
          { id: uid(), characterId: leo.id, text: 'Try me. Was it another cat stuck in a tree?', emotion: 'happy', action: 'wave' },
          { id: uid(), characterId: maya.id, text: 'The midnight scoop truck drove off with the whole street of newspapers!', emotion: 'angry', action: 'none' },
        ],
      },
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'city-night',
        camera: 'closeup',
        transition: 'slide',
        title: '',
        subtitle: '',
        cast: [
          { id: uid(), characterId: maya.id, position: 'center', emotion: 'scared', enter: 'none' },
          { id: uid(), characterId: leo.id, position: 'right', emotion: 'surprised', enter: 'none' },
        ],
        beats: [
          { id: uid(), characterId: leo.id, text: 'Wait… the news truck? At midnight?', emotion: 'surprised', action: 'none' },
          { id: uid(), characterId: maya.id, text: 'And Leo… nobody was driving it.', emotion: 'scared', action: 'shake' },
          { id: uid(), characterId: null, text: 'To be continued…', emotion: 'inherit', action: 'none' },
        ],
      },
      {
        id: uid(),
        kind: 'title',
        backgroundId: 'sunset-hill',
        camera: 'zoom',
        transition: 'fade',
        title: 'To be continued…',
        subtitle: 'Made with StoryForge Studio',
        cast: [],
        beats: [],
      },
    ],
  };
  return project;
}
