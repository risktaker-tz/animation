import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character, Project } from '@/lib/types';
import { uid } from '@/lib/types';

interface StorySettings {
  ttsEnabled: boolean;
  musicEnabled: boolean;
}

interface StoryState {
  characters: Record<string, Character>;
  projects: Record<string, Project>;
  activeProjectId: string | null;
  settings: StorySettings;
  hydrated: boolean;

  putCharacter: (c: Character) => void;
  removeCharacter: (id: string) => void;
  putProject: (p: Project) => void;
  removeProject: (id: string) => void;
  duplicateProject: (id: string) => string | null;
  setActiveProject: (id: string | null) => void;
  patchProject: (id: string, fn: (p: Project) => Project) => void;
  setSetting: <K extends keyof StorySettings>(key: K, value: StorySettings[K]) => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      characters: {},
      projects: {},
      activeProjectId: null,
      settings: { ttsEnabled: true, musicEnabled: true },
      hydrated: false,

      putCharacter: (c) =>
        set((s) => ({ characters: { ...s.characters, [c.id]: c } })),

      removeCharacter: (id) =>
        set((s) => {
          const characters = { ...s.characters };
          delete characters[id];
          // scrub references from projects
          const projects: Record<string, Project> = {};
          for (const [pid, p] of Object.entries(s.projects)) {
            projects[pid] = {
              ...p,
              shots: p.shots.map((sh) => ({
                ...sh,
                cast: sh.cast.filter((c) => c.characterId !== id),
                beats: sh.beats.map((b) =>
                  b.characterId === id ? { ...b, characterId: null } : b
                ),
              })),
            };
          }
          return { characters, projects };
        }),

      putProject: (p) =>
        set((s) => ({ projects: { ...s.projects, [p.id]: p }, activeProjectId: p.id })),

      removeProject: (id) =>
        set((s) => {
          const projects = { ...s.projects };
          delete projects[id];
          return {
            projects,
            activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
          };
        }),

      duplicateProject: (id) => {
        const src = get().projects[id];
        if (!src) return null;
        const copy: Project = {
          ...src,
          id: uid(),
          name: `${src.name} (copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          shots: src.shots.map((sh) => ({
            ...sh,
            id: uid(),
            cast: sh.cast.map((c) => ({ ...c, id: uid() })),
            beats: sh.beats.map((b) => ({ ...b, id: uid() })),
          })),
        };
        set((s) => ({ projects: { ...s.projects, [copy.id]: copy } }));
        return copy.id;
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      patchProject: (id, fn) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return { projects: { ...s.projects, [id]: { ...fn(p), updatedAt: Date.now() } } };
        }),

      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),
    }),
    {
      name: 'storyforge-studio-v1',
      partialize: (s) => ({
        characters: s.characters,
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
