'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { Character, Project } from '@/lib/types';
import { CANVAS_H, CANVAS_W, drawStaticFrame } from '@/lib/engine/renderer';
import { StoryPlayer } from '@/lib/engine/player';
import { ensureBackgroundImage, ensureCharacterImage } from '@/lib/engine/images';
import { MusicEngine } from '@/lib/engine/music';

export interface PlaybackInfo {
  playing: boolean;
  shotIndex: number; // -1 = unchanged
  beatId: string | null;
}

export interface CanvasPreviewHandle {
  play: () => void;
  stop: () => void;
}

interface Props {
  /** parent stores the canvas element (used by the video exporter) */
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  project: Project;
  characters: Record<string, Character>;
  shotIndex: number;
  selectedBeatId: string | null;
  ttsEnabled: boolean;
  musicEnabled: boolean;
  onPlayback: (info: PlaybackInfo) => void;
}

export const CanvasPreview = forwardRef<CanvasPreviewHandle, Props>(
  function CanvasPreview(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const playerRef = useRef<StoryPlayer | null>(null);
    const playingRef = useRef(false);
    const musicRef = useRef<MusicEngine | null>(null);
    const propsRef = useRef(props);

    useEffect(() => {
      propsRef.current = props;
    });

    const stopInternal = () => {
      playerRef.current?.stop();
      playerRef.current = null;
      playingRef.current = false;
      musicRef.current?.stop();
      musicRef.current?.dispose();
      musicRef.current = null;
      propsRef.current.onPlayback({ playing: false, shotIndex: -1, beatId: null });
      const canvas = canvasRef.current;
      const p = propsRef.current;
      const shot = p.project.shots[Math.min(p.shotIndex, p.project.shots.length - 1)];
      if (canvas && shot) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawStaticFrame(ctx, shot, p.characters, {
            beatText: null,
            beatCharacterId: null,
          });
        }
      }
    };

    useImperativeHandle(ref, () => ({
      play: () => {
        const canvas = canvasRef.current;
        const p = propsRef.current;
        if (!canvas || playingRef.current) return;
        const player = new StoryPlayer(canvas, p.project, p.characters, { ttsEnabled: p.ttsEnabled }, {
          onState: (s) => {
            propsRef.current.onPlayback({
              playing: true,
              shotIndex: s.shotIndex,
              beatId: s.beatId,
            });
          },
          onEnd: () => stopInternal(),
        });
        playerRef.current = player;
        playingRef.current = true;
        if (p.musicEnabled) {
          try {
            musicRef.current = new MusicEngine();
            musicRef.current.start();
          } catch {
            musicRef.current = null;
          }
        }
        propsRef.current.onPlayback({ playing: true, shotIndex: 0, beatId: null });
        void player.play();
      },
      stop: () => stopInternal(),
    }));

    // hand the canvas element to the parent exporter once mounted
    const { onCanvasReady } = props;
    useEffect(() => {
      onCanvasReady(canvasRef.current);
      return () => onCanvasReady(null);
    }, [onCanvasReady]);

    // static preview rendering whenever idle state changes
    const { project, characters, shotIndex, selectedBeatId } = props;
    useEffect(() => {
      if (playingRef.current) return;
      let dead = false;
      const canvas = canvasRef.current;
      const idx = Math.min(shotIndex, project.shots.length - 1);
      const shot = project.shots[idx];
      if (!canvas || !shot) {
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, CANVAS_W, CANVAS_H);
        }
        return;
      }
      (async () => {
        try {
          await ensureBackgroundImage(shot.backgroundId);
        } catch {
          /* draw without bg */
        }
        for (const c of shot.cast) {
          const ch = characters[c.characterId];
          if (ch) {
            try {
              await ensureCharacterImage(ch);
            } catch {
              /* placeholder silhouette is drawn instead */
            }
          }
        }
        if (dead || playingRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const beat = shot.beats.find((b) => b.id === selectedBeatId) ?? null;
        drawStaticFrame(ctx, shot, characters, {
          beatText: beat?.text || null,
          beatCharacterId: beat?.characterId ?? null,
          emotionOverride:
            beat && beat.emotion !== 'inherit' ? beat.emotion : undefined,
        });
      })();
      return () => {
        dead = true;
      };
    }, [project, characters, shotIndex, selectedBeatId]);

    useEffect(() => {
      return () => {
        playerRef.current?.stop();
        musicRef.current?.stop();
        musicRef.current?.dispose();
      };
    }, []);

    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0C0A14] shadow-2xl shadow-black/50">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block aspect-video w-full"
          aria-label="Animation preview"
          role="img"
        />
      </div>
    );
  }
);
