'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Music,
  Play,
  Share2,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CanvasPreview,
  type CanvasPreviewHandle,
  type PlaybackInfo,
} from '@/components/studio/canvas-preview';
import { ShotList } from '@/components/studio/shot-list';
import { Inspector } from '@/components/studio/inspector';
import { ExportDialog } from '@/components/studio/export-dialog';
import { useStoryStore } from '@/lib/store';
import { prefetchScript, resetTtsProbe, ttsServiceAvailable } from '@/lib/engine/voice';

export function StudioView({
  projectId,
  onExit,
  onGoCharacters,
}: {
  projectId: string;
  onExit: () => void;
  onGoCharacters: () => void;
}) {
  const project = useStoryStore((s) => s.projects[projectId]);
  const characters = useStoryStore((s) => s.characters);
  const patchProject = useStoryStore((s) => s.patchProject);
  const settings = useStoryStore((s) => s.settings);
  const setSetting = useStoryStore((s) => s.setSetting);

  const [shotIndex, setShotIndex] = useState(0);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackInfo>({
    playing: false,
    shotIndex: 0,
    beatId: null,
  });
  const [exportOpen, setExportOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<CanvasPreviewHandle | null>(null);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  // warm the neural-voice cache for this story in the background so pressing
  // play starts instantly (synthesis is serialized server-side)
  useEffect(() => {
    if (!project || !settings.ttsEnabled) return;
    let dead = false;
    void (async () => {
      if (!(await ttsServiceAvailable())) return;
      const lines: { beatId: string; text: string; characterId: string | null }[] = [];
      for (const shot of project.shots) {
        for (const b of shot.beats) {
          if (b.text) lines.push({ beatId: b.id, text: b.text, characterId: b.characterId });
        }
      }
      if (!lines.length) return;
      await prefetchScript(lines, characters);
      if (!dead) resetTtsProbe();
    })();
    return () => {
      dead = true;
    };
  }, [project, characters, settings.ttsEnabled]);

  // shot selection is clamped at read time (safeIndex) so deletion is safe
  if (!project) {
    return (
      <div className="grid flex-1 place-items-center p-10 text-muted-foreground">
        This story no longer exists.
        <Button variant="secondary" className="ml-3" onClick={onExit}>
          Back to projects
        </Button>
      </div>
    );
  }

  const safeIndex = Math.min(shotIndex, project.shots.length - 1);
  const shot = project.shots[safeIndex];

  const handlePlayback = (info: PlaybackInfo) => {
    setPlayback((prev) => ({
      playing: info.playing,
      shotIndex: info.shotIndex >= 0 ? info.shotIndex : prev.shotIndex,
      beatId: info.beatId,
    }));
    if (info.playing && info.shotIndex >= 0) setShotIndex(info.shotIndex);
    if (info.playing && info.beatId) setSelectedBeatId(info.beatId);
    if (!info.playing && !info.beatId) setSelectedBeatId(null);
  };

  const togglePlay = () => {
    if (playback.playing) {
      previewRef.current?.stop();
    } else {
      previewRef.current?.play();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-4 px-3 py-4 sm:px-5 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="ghost" size="icon" onClick={onExit} aria-label="Back to projects">
          <ArrowLeft className="size-4" />
        </Button>
        <Input
          value={project.name}
          onChange={(e) => patchProject(projectId, (p) => ({ ...p, name: e.target.value }))}
          className="h-9 w-48 sm:w-64 font-semibold"
          aria-label="Story title"
        />
        <span className="hidden text-xs text-muted-foreground md:inline">
          Shot {safeIndex + 1} of {project.shots.length}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                {settings.ttsEnabled ? (
                  <Volume2 className="size-4 text-primary" />
                ) : (
                  <VolumeX className="size-4" />
                )}
                <Switch
                  checked={settings.ttsEnabled}
                  onCheckedChange={(v) => setSetting('ttsEnabled', v)}
                  aria-label="Toggle voices"
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>Voice acting (browser voices)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <Music className={`size-4 ${settings.musicEnabled ? 'text-primary' : ''}`} />
                <Switch
                  checked={settings.musicEnabled}
                  onCheckedChange={(v) => setSetting('musicEnabled', v)}
                  aria-label="Toggle music"
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>Background score</TooltipContent>
          </Tooltip>
          <Button
            onClick={togglePlay}
            className="gap-2 min-w-[104px]"
            variant={playback.playing ? 'destructive' : 'default'}
          >
            {playback.playing ? (
              <>
                <Square className="size-4" /> Stop
              </>
            ) : (
              <>
                <Play className="size-4" /> Play story
              </>
            )}
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => setExportOpen(true)}>
            <Share2 className="size-4" /> Export
          </Button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-60 lg:overflow-y-auto lg:pr-1">
          <ShotList
            project={project}
            shotIndex={safeIndex}
            disabled={playback.playing}
            onSelect={(i) => {
              setShotIndex(i);
              setSelectedBeatId(null);
            }}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="relative">
            <CanvasPreview
              ref={previewRef}
              onCanvasReady={handleCanvasReady}
              project={project}
              characters={characters}
              shotIndex={playback.playing ? playback.shotIndex : safeIndex}
              selectedBeatId={selectedBeatId}
              ttsEnabled={settings.ttsEnabled}
              musicEnabled={settings.musicEnabled}
              onPlayback={handlePlayback}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {playback.playing
              ? 'Playing your story… press Stop any time.'
              : 'Select a shot on the left, pick the speaking line to preview it, then press Play.'}
          </p>
        </section>

        <aside className="w-full shrink-0 lg:w-[350px] lg:overflow-y-auto lg:pl-1">
          <Inspector
            project={project}
            shot={shot}
            shotIndex={safeIndex}
            selectedBeatId={selectedBeatId}
            onSelectBeat={setSelectedBeatId}
            onGoCharacters={onGoCharacters}
          />
        </aside>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={(o) => {
          setExportOpen(o);
          if (!o) previewRef.current?.stop();
        }}
        project={project}
        characters={characters}
        canvasRef={canvasRef}
        ttsEnabled={settings.ttsEnabled}
        musicEnabled={settings.musicEnabled}
      />
    </div>
  );
}
