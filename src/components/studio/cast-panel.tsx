'use client';

import { Plus, Trash2, UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildCharacterSvg } from '@/lib/character-svg';
import { useStoryStore } from '@/lib/store';
import {
  EMOTIONS,
  EMOTION_LABELS,
  uid,
  type Character,
  type Emotion,
  type EnterType,
  type Position,
  type Project,
  type Shot,
} from '@/lib/types';
import type { PatchShot } from '@/components/studio/scene-panel';
import { SvgInline } from '@/components/svg-inline';

const POSITION_LABELS: Record<Position, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
};

const ENTER_LABELS: Record<EnterType, string> = {
  none: 'Already on stage',
  fade: 'Fades in',
  walkLeft: 'Walks in from left',
  walkRight: 'Walks in from right',
};

export function CastPanel({
  project,
  shot,
  patch,
  onGoCharacters,
}: {
  project: Project;
  shot: Shot;
  patch: PatchShot;
  onGoCharacters: () => void;
}) {
  const characters = useStoryStore((s) => s.characters);
  const all = Object.values(characters);
  const inShot = new Set(shot.cast.map((c) => c.characterId));
  const available = all.filter((c) => !inShot.has(c.id));

  if (shot.kind === 'title') {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Title cards have no actors. Switch this shot to a scene to cast them.
      </p>
    );
  }

  const addCast = (characterId: string) => {
    patch((s) => ({
      ...s,
      cast: [
        ...s.cast,
        {
          id: uid(),
          characterId,
          position: (['left', 'center', 'right'] as Position[]).find(
            (p) => !s.cast.some((c) => c.position === p)
          ) ?? 'left',
          emotion: 'neutral',
          enter: 'none',
        },
      ],
    }));
  };

  return (
    <div className="flex flex-col gap-3">
      {shot.cast.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No actors in this scene yet.
        </p>
      )}

      {shot.cast.map((entry) => {
        const ch: Character | undefined = characters[entry.characterId];
        return (
          <div key={entry.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-secondary">
                {ch ? <SvgInline svg={buildCharacterSvg(ch.look)} className="portrait-svg h-full w-full" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{ch?.name ?? 'Missing actor'}</p>
                <p className="text-[11px] text-muted-foreground">
                  {ch ? 'Tap the Cast tab in the menu to edit looks' : 'This actor was deleted'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Remove ${ch?.name ?? 'actor'} from scene`}
                onClick={() =>
                  patch((s) => ({
                    ...s,
                    cast: s.cast.filter((c) => c.id !== entry.id),
                    beats: s.beats.map((b) =>
                      b.characterId === entry.characterId ? { ...b, characterId: null } : b
                    ),
                  }))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Position</Label>
                  <Select
                    value={entry.position}
                    onValueChange={(v) =>
                      patch((s) => ({
                        ...s,
                        cast: s.cast.map((c) =>
                          c.id === entry.id ? { ...c, position: v as Position } : c
                        ),
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(POSITION_LABELS) as Position[]).map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">
                          {POSITION_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Emotion</Label>
                  <Select
                    value={entry.emotion}
                    onValueChange={(v) =>
                      patch((s) => ({
                        ...s,
                        cast: s.cast.map((c) =>
                          c.id === entry.id ? { ...c, emotion: v as Emotion } : c
                        ),
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e} className="text-xs">
                          {EMOTION_LABELS[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Entrance</Label>
                <Select
                  value={entry.enter}
                  onValueChange={(v) =>
                    patch((s) => ({
                      ...s,
                      cast: s.cast.map((c) =>
                        c.id === entry.id ? { ...c, enter: v as EnterType } : c
                      ),
                    }))
                  }
                >
                  <SelectTrigger className="mt-1 h-8 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ENTER_LABELS) as EnterType[]).map((e) => (
                      <SelectItem key={e} value={e} className="text-xs">
                        {ENTER_LABELS[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      })}

      {available.length > 0 ? (
        <Select onValueChange={(v) => addCast(v)} value="">
          <SelectTrigger className="w-full gap-2" aria-label="Add actor to scene">
            <Plus className="size-4" />
            <SelectValue placeholder="Add actor to scene" />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Button variant="secondary" className="gap-2" onClick={onGoCharacters}>
          <UserRoundX className="size-4" />
          {all.length === 0 ? 'Create your first actor' : 'All actors are in this scene'}
        </Button>
      )}
    </div>
  );
}
