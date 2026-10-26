'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileJson, ImageDown, Loader2, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Character, Project } from '@/lib/types';
import { MusicEngine } from '@/lib/engine/music';
import { StoryPlayer } from '@/lib/engine/player';
import { VideoRecorder, downloadBlob, recorderSupported, safeFileName } from '@/lib/engine/recorder';
import { preloadProjectAssets } from '@/lib/engine/images';

type Phase = 'idle' | 'preparing' | 'recording';

export function ExportDialog({
  open,
  onOpenChange,
  project,
  characters,
  canvasRef,
  ttsEnabled,
  musicEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  characters: Record<string, Character>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ttsEnabled: boolean;
  musicEnabled: boolean;
}) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>('idle');
  const musicRef = useRef<MusicEngine | null>(null);
  const playerRef = useRef<StoryPlayer | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    return () => {
      // hard cleanup if the dialog unmounts mid-recording
      cancelRef.current = true;
      playerRef.current?.stop();
      musicRef.current?.stop();
      musicRef.current?.dispose();
    };
  }, []);

  const recordVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!recorderSupported()) {
      toast({
        title: 'Video export unavailable',
        description: 'This browser cannot record canvas video. Try Chrome or Edge.',
        variant: 'destructive',
      });
      return;
    }
    cancelRef.current = false;
    setPhase('preparing');
    try {
      await preloadProjectAssets(project, characters);
      if (cancelRef.current) return;

      const recorder = new VideoRecorder(canvas);
      let audioStream: MediaStream | null = null;
      if (musicEnabled) {
        try {
          musicRef.current = new MusicEngine();
          audioStream = musicRef.current.start();
        } catch {
          musicRef.current = null;
        }
      }
      recorder.start(audioStream);
      setPhase('recording');

      const player = new StoryPlayer(canvas, project, characters, { ttsEnabled }, {
        onState: () => undefined,
        onEnd: () => undefined,
      });
      playerRef.current = player;
      await player.play();
      playerRef.current = null;

      const blob = await recorder.stop();
      musicRef.current?.stop();
      musicRef.current?.dispose();
      musicRef.current = null;
      if (!cancelRef.current) {
        downloadBlob(blob, `${safeFileName(project.name)}.webm`);
        toast({
          title: 'Video exported',
          description: `${project.name}.webm saved to your downloads.`,
        });
      }
    } catch (e) {
      toast({
        title: 'Export failed',
        description: e instanceof Error ? e.message : 'Unknown error while recording',
        variant: 'destructive',
      });
    } finally {
      musicRef.current?.stop();
      musicRef.current?.dispose();
      musicRef.current = null;
      setPhase('idle');
    }
  };

  const cancelRecording = () => {
    cancelRef.current = true;
    playerRef.current?.stop();
    playerRef.current = null;
    musicRef.current?.stop();
    musicRef.current?.dispose();
    musicRef.current = null;
    setPhase('idle');
    toast({ title: 'Recording cancelled' });
  };

  const exportJson = () => {
    const used = new Set<string>();
    project.shots.forEach((sh) => sh.cast.forEach((c) => used.add(c.characterId)));
    const bundle = {
      kind: 'storyforge-project',
      version: 1,
      project,
      characters: Object.values(characters).filter((c) => used.has(c.id)),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${safeFileName(project.name)}.storyforge.json`);
    toast({ title: 'Project exported as JSON' });
  };

  const saveFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${safeFileName(project.name)}-frame.png`);
        toast({ title: 'Frame saved as PNG' });
      }
    }, 'image/png');
  };

  const busy = phase !== 'idle';

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export “{project.name}”</DialogTitle>
          <DialogDescription>
            Share your story as a video file, save a still frame, or export the
            editable project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                <Video className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Record video (.webm)</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Plays the whole story once and records the picture with its
                  musical score and burned-in captions. Browser voices play aloud
                  live but cannot be embedded by browsers — for a voice track,
                  screen-record with audio.
                </p>
              </div>
            </div>
            {busy ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  {phase === 'preparing' ? 'Preparing assets…' : 'Recording story…'}
                </span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={cancelRecording}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button className="mt-3 w-full gap-2" onClick={() => void recordVideo()}>
                <Video className="size-4" /> Start recording
              </Button>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" className="gap-2" onClick={exportJson} disabled={busy}>
              <FileJson className="size-4" /> Project (.json)
            </Button>
            <Button variant="secondary" className="gap-2" onClick={saveFrame} disabled={busy}>
              <ImageDown className="size-4" /> Frame (.png)
            </Button>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Download className="size-3" />
            Files download straight from your browser — nothing is uploaded.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
