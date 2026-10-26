'use client';

import { useMemo, useRef } from 'react';
import {
  Clapperboard,
  Copy,
  Download,
  Film,
  Plus,
  Mic2,
  Camera,
  Video,
  UserPlus,
  MoreVertical,
  Trash2,
  Upload,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { SvgInline } from '@/components/svg-inline';
import { useStoryStore } from '@/lib/store';
import { newProject } from '@/lib/sample';
import { getBackground } from '@/lib/backgrounds';
import type { Character, Project } from '@/lib/types';

interface ExportBundle {
  kind: 'storyforge-project';
  version: 1;
  project: Project;
  characters: Character[];
}

export function HomeView({
  onOpenProject,
  onGoCharacters,
}: {
  onOpenProject: (id: string) => void;
  onGoCharacters: () => void;
}) {
  const projects = useStoryStore((s) => s.projects);
  const characters = useStoryStore((s) => s.characters);
  const putProject = useStoryStore((s) => s.putProject);
  const removeProject = useStoryStore((s) => s.removeProject);
  const duplicateProject = useStoryStore((s) => s.duplicateProject);
  const putCharacter = useStoryStore((s) => s.putCharacter);
  const setActiveProject = useStoryStore((s) => s.setActiveProject);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt),
    [projects]
  );

  const createStory = () => {
    const p = newProject('Untitled story');
    putProject(p);
    onOpenProject(p.id);
  };

  const exportJson = (p: Project) => {
    const used = new Set<string>();
    p.shots.forEach((sh) => sh.cast.forEach((c) => used.add(c.characterId)));
    const bundle: ExportBundle = {
      kind: 'storyforge-project',
      version: 1,
      project: p,
      characters: Object.values(characters).filter((c) => used.has(c.id)),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '-').toLowerCase()}.storyforge.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast({ title: 'Project exported', description: `${p.name}.storyforge.json` });
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportBundle;
      if (data.kind !== 'storyforge-project' || !data.project?.shots) {
        throw new Error('Not a StoryForge project file');
      }
      const p: Project = {
        ...data.project,
        id: crypto.randomUUID(),
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      (data.characters ?? []).forEach((c) => putCharacter(c));
      putProject(p);
      toast({ title: 'Project imported', description: p.name });
    } catch (e) {
      toast({
        title: 'Import failed',
        description: e instanceof Error ? e.message : 'Invalid file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-grid-glow border-b border-border/60">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Film className="size-3.5" /> Animation story maker
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Turn your ideas into <span className="text-gradient">animated stories</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Create actors, pick scenes, write the dialogue and watch your story play
            itself — with voices, emotions, camera moves and one-click video export.
            No install, no account, runs entirely in your browser.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="gap-2 text-base" onClick={createStory}>
              <Plus className="size-5" /> New story
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 text-base" onClick={onGoCharacters}>
              <UserPlus className="size-5" /> Create an actor
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-5" /> Import project
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importJson(f);
                e.target.value = '';
              }}
            />
          </div>
          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-center">
            {[
              ['12', 'cinematic scenes'],
              ['6', 'emotions per actor'],
              ['1-click', 'video export'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-border/70 bg-card/60 px-3 py-4">
                <dt className="text-2xl sm:text-3xl font-extrabold text-gradient">{v}</dt>
                <dd className="mt-1 text-xs sm:text-sm text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1500px] px-4 sm:px-6 pt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Mic2 className="size-5" />,
              title: 'Voices that act',
              body: 'Every actor gets a browser voice with its own pitch and pace. Narrator lines become voice-over captions.',
            },
            {
              icon: <UserPlus className="size-5" />,
              title: 'Character creator',
              body: 'Skin tones, 8 hairstyles, outfits, glasses — build an unlimited cast, free.',
            },
            {
              icon: <Camera className="size-5" />,
              title: 'Cinematic camera',
              body: 'Wide shots, close-ups and slow zooms, plus fades and slide transitions between scenes.',
            },
            {
              icon: <Video className="size-5" />,
              title: 'Export & share',
              body: 'Record your story to a video file with its musical score, or export the project as JSON.',
            },
          ].map((f) => (
            <Card key={f.title} className="border-border/70 bg-card/50">
              <CardContent className="p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mx-auto w-full max-w-[1500px] flex-1 px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">Your stories</h2>
          <Button variant="secondary" size="sm" className="gap-2" onClick={createStory}>
            <PenLine className="size-4" /> New
          </Button>
        </div>
        {sorted.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No stories yet — create your first one above.
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((p) => {
              const firstScene = p.shots.find((s) => s.kind === 'scene') ?? p.shots[0];
              const bg = firstScene ? getBackground(firstScene.backgroundId) : null;
              return (
                <li key={p.id}>
                  <Card className="group overflow-hidden border-border/70 bg-card transition-colors hover:border-primary/50">
                    <button
                      className="block w-full text-left"
                      onClick={() => onOpenProject(p.id)}
                      aria-label={`Open ${p.name}`}
                    >
                      <div className="relative h-32 w-full overflow-hidden bg-secondary">
                        {bg ? <SvgInline svg={bg.svg()} className="thumb-svg h-full w-full" /> : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
                          <Clapperboard className="size-3" />
                          {p.shots.length} shot{p.shots.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </button>
                    <CardContent className="flex items-center gap-2 p-3">
                      <button className="min-w-0 flex-1 text-left" onClick={() => onOpenProject(p.id)}>
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          edited {new Date(p.updatedAt).toLocaleDateString()}
                        </p>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Project actions">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOpenProject(p.id)}>
                            <PenLine className="size-4" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportJson(p)}>
                            <Download className="size-4" /> Export JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const id = duplicateProject(p.id);
                              if (id) toast({ title: 'Duplicated', description: p.name });
                            }}
                          >
                            <Copy className="size-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="size-4" /> Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete “{p.name}”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the story from this browser. Export
                                  it first if you want a backup.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => {
                                    removeProject(p.id);
                                    toast({ title: 'Story deleted' });
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-auto border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-6 text-center text-xs leading-relaxed text-muted-foreground">
          StoryForge Studio — an original, open-source animation story maker built with
          Next.js. Inspired by the feature set of commercial story-animation tools;
          all code, art and assets here are original.
        </div>
      </footer>
    </div>
  );
}
