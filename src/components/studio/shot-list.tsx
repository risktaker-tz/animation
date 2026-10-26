'use client';

import {
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Copy,
  Plus,
  Trash2,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { SvgInline } from '@/components/svg-inline';
import { useStoryStore } from '@/lib/store';
import { emptyShot } from '@/lib/sample';
import { getBackground } from '@/lib/backgrounds';
import { uid, type Project, type Shot } from '@/lib/types';

export function ShotList({
  project,
  shotIndex,
  disabled,
  onSelect,
}: {
  project: Project;
  shotIndex: number;
  disabled: boolean;
  onSelect: (index: number) => void;
}) {
  const patchProject = useStoryStore((s) => s.patchProject);
  const { toast } = useToast();

  const mutate = (fn: (shots: Shot[]) => Shot[]) =>
    patchProject(project.id, (p) => ({ ...p, shots: fn(p.shots) }));

  const addScene = () => {
    mutate((shots) => [...shots, emptyShot()]);
    onSelect(project.shots.length);
    toast({ title: 'Scene added' });
  };

  const addTitle = () => {
    const s = { ...emptyShot(), kind: 'title' as const, backgroundId: 'stage', title: 'New title card' };
    mutate((shots) => [...shots, s]);
    onSelect(project.shots.length);
    toast({ title: 'Title card added' });
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= project.shots.length) return;
    mutate((shots) => {
      const copy = [...shots];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    onSelect(j);
  };

  const duplicate = (i: number) => {
    mutate((shots) => {
      const src = shots[i];
      const clone: Shot = {
        ...src,
        id: uid(),
        cast: src.cast.map((c) => ({ ...c, id: uid() })),
        beats: src.beats.map((b) => ({ ...b, id: uid() })),
      };
      const copy = [...shots];
      copy.splice(i + 1, 0, clone);
      return copy;
    });
  };

  const remove = (i: number) => {
    mutate((shots) => shots.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Storyboard
        </h2>
        <span className="text-xs text-muted-foreground">{project.shots.length}</span>
      </div>

      <ol className="flex flex-col gap-2" aria-label="Shots">
        {project.shots.map((shot, i) => {
          const bg = getBackground(shot.backgroundId);
          const active = i === shotIndex;
          return (
            <li key={shot.id}>
              <div
                role="button"
                tabIndex={0}
                aria-current={active ? 'true' : undefined}
                onClick={() => !disabled && onSelect(i)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) onSelect(i);
                }}
                className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 text-left transition-colors ${
                  active
                    ? 'border-primary/70 bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40'
                } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="h-11 w-16 shrink-0 overflow-hidden rounded-md border border-border/70">
                  <SvgInline svg={getBackground(shot.backgroundId).svg()} className="thumb-svg h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[13px] font-semibold">
                    {shot.kind === 'title' ? (
                      <Type className="size-3 shrink-0 text-fuchsia-300" />
                    ) : (
                      <Clapperboard className="size-3 shrink-0 text-primary" />
                    )}
                    {shot.kind === 'title'
                      ? shot.title || 'Title card'
                      : bg.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {shot.kind === 'title'
                      ? bg.name
                      : `${shot.cast.length} actor${shot.cast.length === 1 ? '' : 's'} · ${shot.beats.length} line${shot.beats.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      aria-label={`Actions for shot ${i + 1}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronUp className="hidden" />
                      <span className="text-xs">···</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => move(i, -1)} disabled={i === 0}>
                      <ChevronUp className="size-4" /> Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => move(i, 1)}
                      disabled={i === project.shots.length - 1}
                    >
                      <ChevronDown className="size-4" /> Move down
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(i)}>
                      <Copy className="size-4" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => remove(i)}
                      disabled={project.shots.length <= 1}
                    >
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-1 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={addScene} disabled={disabled}>
          <Plus className="size-4" /> Scene
        </Button>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={addTitle} disabled={disabled}>
          <Type className="size-4" /> Title
        </Button>
      </div>
    </div>
  );
}
