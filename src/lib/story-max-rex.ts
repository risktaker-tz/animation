import type { BeatAction, Character, Emotion, Position, EnterType, Project } from '@/lib/types';
import { uid } from '@/lib/types';

// ---------------------------------------------------------------------------
// "Max & Rex: The Homework Trick" — the StoryForge demo story.
// A family kid who doesn't want to study but loves animals.
// Showcases: neural per-character voices, child variant, animal actors,
// activity poses (write/read/sneak), and two-actor interactions
// (pet, fetch, high-five, hug).
// ---------------------------------------------------------------------------

interface CharSpec {
  id: string;
  name: string;
  kind?: 'human' | 'animal';
  species?: 'dog' | 'cat' | 'bird';
  look: Character['look'];
  voice: Character['voice'];
}

export const MAX_ID = 'ch-max';
export const MOM_ID = 'ch-mom';
export const DAD_ID = 'ch-dad';
export const REX_ID = 'ch-rex';
export const WHISKERS_ID = 'ch-whiskers';

export const STORY_CHARACTERS: Character[] = [
  {
    id: MAX_ID,
    name: 'Max',
    kind: 'human',
    look: {
      skin: '#F2C879',
      hair: 'spiky',
      hairColor: '#4A3320',
      outfit: 'hoodie',
      outfitColor: '#37421F',
      pantsColor: '#23262E',
      glasses: false,
      age: 'child',
    },
    voice: { voiceURI: '', rate: 1, pitch: 1.25, voiceId: 'am_puck', speed: 1.04, pitchShift: 1.2 },
  },
  {
    id: MOM_ID,
    name: 'Mom',
    kind: 'human',
    look: {
      skin: '#E8B36A',
      hair: 'bun',
      hairColor: '#2E241C',
      outfit: 'sweater',
      outfitColor: '#40242E',
      pantsColor: '#2A2A30',
      glasses: false,
      age: 'adult',
    },
    voice: { voiceURI: '', rate: 1, pitch: 1.05, voiceId: 'af_heart', speed: 0.98, pitchShift: 1 },
  },
  {
    id: DAD_ID,
    name: 'Dad',
    kind: 'human',
    look: {
      skin: '#D98E4A',
      hair: 'short',
      hairColor: '#20222C',
      outfit: 'blazer',
      outfitColor: '#1F3340',
      pantsColor: '#23262E',
      glasses: true,
      age: 'adult',
    },
    voice: { voiceURI: '', rate: 1, pitch: 0.85, voiceId: 'am_michael', speed: 0.96, pitchShift: 1 },
  },
  {
    id: REX_ID,
    name: 'Rex',
    kind: 'animal',
    species: 'dog',
    look: {
      skin: '#E8B36A',
      hair: 'short',
      hairColor: '#2E241C',
      outfit: 'tee',
      outfitColor: '#37421F',
      pantsColor: '#23262E',
      glasses: false,
    },
    voice: { voiceURI: '', rate: 1, pitch: 1.4, voiceId: 'am_puck', speed: 1.18, pitchShift: 1.52 },
  },
  {
    id: WHISKERS_ID,
    name: 'Whiskers',
    kind: 'animal',
    species: 'cat',
    look: {
      skin: '#C9A3D9',
      hair: 'short',
      hairColor: '#2E241C',
      outfit: 'tee',
      outfitColor: '#3A2444',
      pantsColor: '#23262E',
      glasses: false,
    },
    voice: { voiceURI: '', rate: 1, pitch: 1.4, voiceId: 'af_sky', speed: 1.1, pitchShift: 1.45 },
  },
];

// cast entry ids (stable within a built project)
const C_MAX = 'cast-max';
const C_MOM = 'cast-mom';
const C_DAD = 'cast-dad';
const C_REX = 'cast-rex';
const C_WHISKERS = 'cast-whiskers';

function cast(
  castId: string,
  characterId: string,
  position: Position,
  emotion: Emotion = 'neutral',
  enter: EnterType = 'none'
) {
  return { id: castId, characterId, position, emotion, enter };
}

function beat(
  characterId: string | null,
  text: string,
  action: BeatAction = 'none',
  emotion: Emotion | 'inherit' = 'inherit',
  targetId?: string
) {
  return { id: uid(), characterId, text, action, emotion, targetId: targetId ?? null };
}

export function buildMaxRexProject(): Project {
  const now = Date.now();
  return {
    id: uid(),
    name: 'Max & Rex: The Homework Trick',
    createdAt: now,
    updatedAt: now,
    shots: [
      // ---------------------------------------------------------- title
      {
        id: uid(),
        kind: 'title',
        backgroundId: 'sunset-hill',
        camera: 'zoom',
        transition: 'fade',
        title: 'Max & Rex',
        subtitle: 'The Homework Trick — a StoryForge story',
        cast: [],
        beats: [
          beat(
            null,
            'This is the story of a boy who did not want to study… and the animals who changed his mind.',
            'none',
            'inherit'
          ),
        ],
      },
      // ---------------------------------------------------------- bedroom
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'bedroom',
        camera: 'wide',
        transition: 'fade',
        title: '',
        subtitle: '',
        cast: [
          cast(C_MAX, MAX_ID, 'center', 'sad'),
          cast(C_MOM, MOM_ID, 'right', 'neutral', 'walkRight'),
        ],
        beats: [
          beat(null, 'Saturday morning. Homework time.', 'none'),
          beat(MAX_ID, 'Addition. Spelling. AGAIN. I do NOT want to study!', 'write', 'angry'),
          beat(MAX_ID, 'Books are so boring… animals are awesome.', 'sulk', 'sad'),
          beat(MOM_ID, 'Max! Homework first, then play.', 'point', 'neutral'),
          beat(MAX_ID, 'But Mom… studying is for grown-ups!', 'shrug', 'sad'),
          beat(MOM_ID, 'Finish page ten. I will check in one hour.', 'nod', 'neutral'),
          beat(MOM_ID, 'And no sneaking off, young man.', 'point', 'happy'),
        ],
      },
      // ---------------------------------------------------------- living room
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'living-room',
        camera: 'wide',
        transition: 'slide',
        title: '',
        subtitle: '',
        cast: [
          cast(C_MAX, MAX_ID, 'left', 'neutral'),
          cast(C_WHISKERS, WHISKERS_ID, 'center', 'neutral'),
          cast(C_REX, REX_ID, 'right', 'neutral', 'runLeft'),
        ],
        beats: [
          beat(MAX_ID, 'While Mom is busy… Operation Animal Time begins!', 'sneak', 'happy'),
          beat(WHISKERS_ID, 'Meow!', 'meow', 'happy'),
          beat(MAX_ID, 'Whiskers! And look — Rex is ready to play!', 'cheer', 'happy'),
          beat(REX_ID, 'Woof woof!', 'bark', 'happy'),
        ],
      },
      // ---------------------------------------------------------- park fetch
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'park',
        camera: 'wide',
        transition: 'fade',
        title: '',
        subtitle: '',
        cast: [
          cast(C_MAX, MAX_ID, 'left', 'happy'),
          cast(C_REX, REX_ID, 'right', 'happy'),
        ],
        beats: [
          beat(null, 'At the park, Max and Rex played their favorite game.', 'none'),
          beat(MAX_ID, 'Go get it, Rex!', 'fetch', 'happy', C_REX),
          beat(REX_ID, 'Woof!', 'run', 'happy'),
          beat(MAX_ID, 'Good boy! You found it so fast. You are the smartest dog ever!', 'pet', 'happy', C_REX),
          beat(REX_ID, 'Woof woof!', 'wag', 'happy'),
          beat(MAX_ID, 'Haha! You always make me laugh, boy.', 'laugh', 'happy'),
          beat(MAX_ID, 'Hmm… how DO you find everything so quickly, boy?', 'think', 'neutral'),
        ],
      },
      // ---------------------------------------------------------- park dad
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'park',
        camera: 'wide',
        transition: 'fade',
        title: '',
        subtitle: '',
        cast: [
          cast(C_MAX, MAX_ID, 'left', 'happy'),
          cast(C_REX, REX_ID, 'center', 'happy'),
          cast(C_DAD, DAD_ID, 'right', 'neutral', 'walkRight'),
        ],
        beats: [
          beat(DAD_ID, 'Max… is not homework time right now?', 'point', 'neutral'),
          beat(MAX_ID, 'I… I was just… Rex needed exercise!', 'gasp', 'scared'),
          beat(DAD_ID, 'Interesting. You taught Rex to fetch all by yourself?', 'think', 'neutral'),
          beat(MAX_ID, 'Well… yeah. Watch! Rex, sit!', 'point', 'neutral'),
          beat(REX_ID, 'Woof!', 'sit', 'happy'),
          beat(DAD_ID, 'That, kiddo, is animal science. Vets and zookeepers study every single day — to help animals.', 'nod', 'happy'),
          beat(MAX_ID, 'WAIT. Studying helps me help ANIMALS?! Then give me that homework!', 'cheer', 'surprised'),
          beat(DAD_ID, 'Ha! That is the spirit, champ.', 'laugh', 'happy'),
          beat(MAX_ID, 'High five, Dad!', 'highfive', 'happy', C_DAD),
        ],
      },
      // ---------------------------------------------------------- bedroom again
      {
        id: uid(),
        kind: 'scene',
        backgroundId: 'bedroom',
        camera: 'wide',
        transition: 'fade',
        title: '',
        subtitle: '',
        cast: [
          cast(C_MAX, MAX_ID, 'left', 'happy'),
          cast(C_REX, REX_ID, 'center', 'happy'),
          cast(C_MOM, MOM_ID, 'right', 'surprised'),
        ],
        beats: [
          beat(MAX_ID, 'Chapter One: The Super Sniffing Power of Dogs!', 'read', 'happy'),
          beat(MAX_ID, 'See, Rex? I am studying… for US!', 'write', 'happy'),
          beat(REX_ID, 'Woof woof!', 'wag', 'happy'),
          beat(MOM_ID, 'Well… THAT is new!', 'laugh', 'happy'),
          beat(MOM_ID, 'I am proud of you, Max.', 'clap', 'happy'),
          beat(null, 'Max still loves animals more than anything. But now he has a dream — and a plan.', 'none'),
          beat(MAX_ID, 'Homework now… vet school later! Come on, Rex!', 'cheer', 'happy'),
        ],
      },
      // ---------------------------------------------------------- end
      {
        id: uid(),
        kind: 'title',
        backgroundId: 'sunset-hill',
        camera: 'zoom',
        transition: 'fade',
        title: 'The End',
        subtitle: 'Find what makes you curious — then study like crazy.',
        cast: [],
        beats: [
          beat(null, 'Every great dream starts with a spark. Feed your spark, and one day it will shine.', 'none', 'inherit'),
        ],
      },
    ],
  };
}
