'use client';

import { Clapperboard, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type View = 'home' | 'studio' | 'characters';

export function AppShell({
  view,
  onNavigate,
  children,
}: {
  view: View;
  onNavigate: (v: View) => void;
  children: React.ReactNode;
}) {
  const navItem = (target: View, label: string, icon: React.ReactNode) => (
    <Button
      variant={view === target ? 'secondary' : 'ghost'}
      size="sm"
      className="gap-2"
      onClick={() => onNavigate(target)}
      aria-current={view === target ? 'page' : undefined}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-2 px-3 sm:px-5">
          <button
            className="flex items-center gap-2.5 mr-3 group"
            onClick={() => onNavigate('home')}
            aria-label="StoryForge home"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/40 transition-transform group-hover:scale-105">
              <Clapperboard className="size-5" />
            </span>
            <span className="text-[15px] font-bold tracking-tight leading-none">
              StoryForge
              <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/90">
                Studio
              </span>
            </span>
          </button>
          <nav className="flex items-center gap-1" aria-label="Main">
            {navItem('home', 'Projects', <Home className="size-4" />)}
            {navItem('characters', 'Cast', <Users className="size-4" />)}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
