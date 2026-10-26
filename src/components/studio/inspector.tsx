'use client';

import { Image as ImageIcon, MessageSquareText, UsersRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenePanel, type PatchShot } from '@/components/studio/scene-panel';
import { CastPanel } from '@/components/studio/cast-panel';
import { DialoguePanel } from '@/components/studio/dialogue-panel';
import { useStoryStore } from '@/lib/store';
import type { Project, Shot } from '@/lib/types';

export function Inspector({
  project,
  shot,
  shotIndex,
  selectedBeatId,
  onSelectBeat,
  onGoCharacters,
}: {
  project: Project;
  shot: Shot;
  shotIndex: number;
  selectedBeatId: string | null;
  onSelectBeat: (id: string | null) => void;
  onGoCharacters: () => void;
}) {
  const characters = useStoryStore((s) => s.characters);
  const patchProject = useStoryStore((s) => s.patchProject);

  const patchShot: PatchShot = (fn) =>
    patchProject(project.id, (p) => ({
      ...p,
      shots: p.shots.map((s, i) => (i === shotIndex ? fn(s) : s)),
    }));

  return (
    <Tabs defaultValue="scene" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="scene" className="gap-1.5 text-xs">
          <ImageIcon className="size-3.5" /> Scene
        </TabsTrigger>
        <TabsTrigger value="cast" className="gap-1.5 text-xs">
          <UsersRound className="size-3.5" /> Cast
        </TabsTrigger>
        <TabsTrigger value="dialogue" className="gap-1.5 text-xs">
          <MessageSquareText className="size-3.5" /> Dialogue
        </TabsTrigger>
      </TabsList>
      <TabsContent value="scene" className="mt-3">
        <ScenePanel shot={shot} patch={patchShot} />
      </TabsContent>
      <TabsContent value="cast" className="mt-3">
        <CastPanel
          project={project}
          shot={shot}
          patch={patchShot}
          onGoCharacters={onGoCharacters}
        />
      </TabsContent>
      <TabsContent value="dialogue" className="mt-3">
        <DialoguePanel
          shot={shot}
          patch={patchShot}
          characters={characters}
          selectedBeatId={selectedBeatId}
          onSelectBeat={onSelectBeat}
        />
      </TabsContent>
    </Tabs>
  );
}
