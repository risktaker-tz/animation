'use client';

import { useEffect, useState } from 'react';
import { AppShell, type View } from '@/components/app-shell';
import { HomeView } from '@/components/home-view';
import { StudioView } from '@/components/studio-view';
import { CharacterView } from '@/components/character-view';
import { Skeleton } from '@/components/ui/skeleton';
import { useMounted } from '@/hooks/use-mounted';
import { useStoryStore } from '@/lib/store';
import { seedCharacters, seedProject } from '@/lib/sample';

function StudioSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1500px] flex-1 space-y-4 p-4 sm:p-5">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr_350px]">
        <Skeleton className="hidden h-[70vh] lg:block" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="hidden h-[70vh] lg:block" />
      </div>
    </div>
  );
}

export default function Page() {
  const mounted = useMounted();
  const hydrated = useStoryStore((s) => s.hydrated);
  const activeProjectId = useStoryStore((s) => s.activeProjectId);
  const [view, setView] = useState<View>('home');
  const [studioProjectId, setStudioProjectId] = useState<string | null>(null);

  // one-time seeding of demo cast + sample story
  useEffect(() => {
    if (!mounted) return;
    const s = useStoryStore.getState();
    if (Object.keys(s.characters).length === 0 && Object.keys(s.projects).length === 0) {
      const chars = seedCharacters();
      chars.forEach((c) => s.putCharacter(c));
      s.putProject(seedProject(chars));
      s.setActiveProject(null);
    }
  }, [mounted]);

  const openProject = (id: string) => {
    setStudioProjectId(id);
    useStoryStore.getState().setActiveProject(id);
    setView('studio');
  };

  const navigate = (v: View) => {
    if (v === 'studio') {
      const id = studioProjectId ?? activeProjectId;
      if (id) openProject(id);
      else setView('home');
      return;
    }
    setView(v);
  };

  return (
    <AppShell view={view} onNavigate={navigate}>
      {!mounted || !hydrated ? (
        <StudioSkeleton />
      ) : view === 'home' ? (
        <HomeView
          onOpenProject={openProject}
          onGoCharacters={() => setView('characters')}
        />
      ) : view === 'studio' && studioProjectId ? (
        <StudioView
          projectId={studioProjectId}
          onExit={() => setView('home')}
          onGoCharacters={() => setView('characters')}
        />
      ) : (
        <CharacterView />
      )}
    </AppShell>
  );
}
