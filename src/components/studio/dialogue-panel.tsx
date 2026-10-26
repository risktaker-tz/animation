'use client';

import { useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ACTION_LABELS,
  EMOTIONS,
  EMOTION_LABELS,
  uid,
  type Beat,
  type BeatAction,
  type Character,
  type Emotion,
  type Shot,
} from '@/lib/types';
import { speak, stopAllSpeech } from '@/lib/engine/tts';
import type { PatchShot } from '@/components/studio/scene-panel';

export function DialoguePanel({
  shot,
  patch,
  characters,
  selectedBeatId,
  onSelectBeat,
}: {
  shot: Shot;
  patch: PatchShot;
  characters: Record<string, Character>;
  selectedBeatId: string | null;
  onSelectBeat: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const testRef = useRef<{ cancel: () => void } | null>(null);

  if (shot.kind === 'title') {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Title cards play silently. Add dialogue in scene shots.
      </p>
    );
  }

  const mutateBeats = (fn: (beats: Beat[]) => Beat[]) =>
    patch((s) => ({ ...s, beats: fn(s.beats) }));

  const addBeat = () => {
    const first = shot.cast[0]?.characterId ?? null;
    const beat: Beat = {
      id: uid(),
      characterId: first,
      text: '',
      emotion: 'inherit',
      action: 'none',
    };
    mutateBeats((b) => [...b, beat]);
    onSelectBeat(beat.id);
  };

  const patchBeat = (id: string, p: Partial<Beat>) =>
    mutateBeats((beats) => beats.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= shot.beats.length) return;
    mutateBeats((beats) => {
      const copy = [...beats];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const testVoice = (beat: Beat) => {
    const ch = beat.characterId ? characters[beat.characterId] : null;
    if (!beat.text.trim()) return;
    testRef.current?.cancel();
    stopAllSpeech();
    testRef.current = speak(beat.text, ch ? ch.voice : { voiceURI: '', rate: 0.95, pitch: 0.9 });
    if (!ch) {
      toast({ title: 'Narrator voice', description: 'Playing with the narrator voice' });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Lines play in order. Pick who speaks, what they feel and what they do —
        the story voices itself when you press play.
      </p>

      {shot.beats.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No dialogue yet — add the first line below.
        </p>
      )}

      <ol className="flex flex-col gap-2.5">
        {shot.beats.map((beat, i) => {
          const ch = beat.characterId ? characters[beat.characterId] : null;
          const active = beat.id === selectedBeatId;
          return (
            <li
              key={beat.id}
              className={`rounded-xl border p-3 transition-colors ${
                active ? 'border-primary/70 bg-primary/10' : 'border-border bg-card'
              }`}
              onClick={() => onSelectBeat(beat.id)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold ${
                    ch ? 'bg-primary/25 text-primary' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {i + 1}
                </span>
                <Select
                  value={beat.characterId ?? 'narrator'}
                  onValueChange={(v) =>
                    patchBeat(beat.id, { characterId: v === 'narrator' ? null : v })
                  }
                >
                  <SelectTrigger className="h-8 min-w-0 flex-1 text-xs" aria-label="Speaker">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shot.cast.map((c) => (
                      <SelectItem key={c.id} value={c.characterId} className="text-xs">
                        {characters[c.characterId]?.name ?? 'Missing actor'}
                      </SelectItem>
                    ))}
                    <SelectItem value="narrator" className="text-xs">
                      Narrator (voice-over)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Move line up"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(i, -1);
                    }}
                    disabled={i === 0}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Move line down"
                    onClick={(e) => {
                      e.stopPropagation();
                      move(i, 1);
                    }}
                    disabled={i === shot.beats.length - 1}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Delete line"
                    onClick={(e) => {
                      e.stopPropagation();
                      mutateBeats((beats) => beats.filter((b) => b.id !== beat.id));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                className="mt-2 min-h-[64px] resize-y border-border/70 bg-background/60 text-sm"
                placeholder={
                  beat.characterId
                    ? `${ch?.name ?? 'Actor'} says something…`
                    : 'The narrator tells us something…'
                }
                value={beat.text}
                onChange={(e) => patchBeat(beat.id, { text: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                aria-label="Dialogue text"
              />

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Emotion</Label>
                  <Select
                    value={beat.emotion}
                    onValueChange={(v) =>
                      patchBeat(beat.id, { emotion: v as Emotion | 'inherit' })
                    }
                  >
                    <SelectTrigger className="mt-1 h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit" className="text-xs">
                        Same as cast
                      </SelectItem>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e} className="text-xs">
                          {EMOTION_LABELS[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Action</Label>
                  <Select
                    value={beat.action}
                    onValueChange={(v) => patchBeat(beat.id, { action: v as BeatAction })}
                  >
                    <SelectTrigger className="mt-1 h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ACTION_LABELS) as BeatAction[]).map((a) => (
                        <SelectItem key={a} value={a} className="text-xs">
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-1.5 text-xs text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  testVoice(beat);
                }}
                disabled={!beat.text.trim()}
              >
                <Volume2 className="size-3.5" /> Test voice
              </Button>
            </li>
          );
        })}
      </ol>

      <Button variant="secondary" className="gap-2" onClick={addBeat}>
        <Plus className="size-4" /> Add line
      </Button>
    </div>
  );
}
