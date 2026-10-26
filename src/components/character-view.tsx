'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, UserRound, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useStoryStore } from '@/lib/store';
import { makeCharacter } from '@/lib/sample';
import { buildCharacterSvg } from '@/lib/character-svg';
import { speak, stopAllSpeech, ttsSupported } from '@/lib/engine/tts';
import { SvgInline } from '@/components/svg-inline';
import {
  CLOTH_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFIT_STYLES,
  PANTS_COLORS,
  SKIN_TONES,
  type Character,
  type CharacterLook,
  type HairStyle,
  type OutfitStyle,
} from '@/lib/types';

const HAIR_LABELS: Record<HairStyle, string> = {
  short: 'Short',
  long: 'Long',
  ponytail: 'Ponytail',
  bun: 'Bun',
  curly: 'Curly',
  spiky: 'Spiky',
  buzz: 'Buzz cut',
  wavy: 'Wavy',
};

const OUTFIT_LABELS: Record<OutfitStyle, string> = {
  tee: 'T-shirt',
  hoodie: 'Hoodie',
  blazer: 'Blazer',
  dress: 'Dress',
  tank: 'Tank top',
  sweater: 'Sweater',
};

function Swatches({
  colors,
  value,
  onChange,
  label,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
  label: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={c === value}
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
            className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
              c === value ? 'border-primary ring-2 ring-primary/40' : 'border-black/20'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

export function CharacterView() {
  const characters = useStoryStore((s) => s.characters);
  const putCharacter = useStoryStore((s) => s.putCharacter);
  const removeCharacter = useStoryStore((s) => s.removeCharacter);
  const { toast } = useToast();

  const list = useMemo(() => Object.values(characters), [characters]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected: Character | undefined =
    (selectedId && characters[selectedId]) || list[0];

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const testRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    if (!ttsSupported()) return;
    let tries = 0;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
      return v.length > 0;
    };
    load();
    const t = setInterval(() => {
      tries += 1;
      if (load() || tries > 8) clearInterval(t);
    }, 700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => stopAllSpeech(), []);

  const update = (patch: Partial<Character>) => {
    if (!selected) return;
    putCharacter({ ...selected, ...patch } as Character);
  };
  const updateLook = (patch: Partial<CharacterLook>) => {
    if (!selected) return;
    update({ look: { ...selected.look, ...patch } });
  };

  const createActor = () => {
    const c = makeCharacter({ name: `Actor ${list.length + 1}` });
    putCharacter(c);
    setSelectedId(c.id);
    toast({ title: 'Actor created', description: 'Customize the look and voice, it saves instantly.' });
  };

  const testVoice = () => {
    if (!selected) return;
    testRef.current?.cancel();
    stopAllSpeech();
    testRef.current = speak(
      `Hi! I am ${selected.name}. I am ready for my close-up.`,
      selected.voice
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Your <span className="text-gradient">cast</span>
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Design the actors that will star in your stories. Changes save
            instantly and apply to every scene they appear in.
          </p>
        </div>
        <Button className="gap-2" onClick={createActor}>
          <Plus className="size-4" /> New actor
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr_380px]">
        {/* Actor list */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Cast · {list.length}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {list.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  aria-pressed={selected?.id === c.id}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                    selected?.id === c.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="mx-auto h-24 w-20 overflow-hidden">
                    <SvgInline svg={buildCharacterSvg(c.look)} className="thumb-svg h-full w-full" />
                  </div>
                  <p className="mt-2 truncate text-center text-sm font-semibold">{c.name}</p>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No actors yet.
              </li>
            )}
          </ul>
        </div>

        {/* Live preview */}
        <div className="order-first lg:order-none">
          <div className="sticky top-20">
            <div className="bg-grid-glow relative overflow-hidden rounded-3xl border border-border bg-card">
              <div className="mx-auto h-[420px] w-full max-w-[300px] p-4">
                {selected ? <SvgInline svg={buildCharacterSvg(selected.look)} className="thumb-svg h-full w-full" /> : null}
              </div>
              {selected && (
                <div className="border-t border-border/70 bg-background/60 px-5 py-3 text-center">
                  <p className="text-lg font-bold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {HAIR_LABELS[selected.look.hair]} hair ·{' '}
                    {OUTFIT_LABELS[selected.look.outfit]}
                    {selected.look.glasses ? ' · glasses' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div>
          {selected ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col gap-5 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor="actor-name" className="text-xs text-muted-foreground">
                      Name
                    </Label>
                    <Input
                      id="actor-name"
                      className="mt-1.5"
                      value={selected.name}
                      onChange={(e) => update({ name: e.target.value })}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5 size-9 shrink-0 text-destructive"
                        aria-label={`Delete ${selected.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selected.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          The actor disappears from your cast. Scenes keep their
                          shots but lose the lines spoken by this actor.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => {
                            removeCharacter(selected.id);
                            setSelectedId(null);
                            toast({ title: 'Actor deleted' });
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Swatches
                  label="Skin tone"
                  colors={SKIN_TONES}
                  value={selected.look.skin}
                  onChange={(skin) => updateLook({ skin })}
                />

                <div>
                  <Label className="text-xs text-muted-foreground">Hairstyle</Label>
                  <div className="mt-1.5 grid grid-cols-4 gap-2">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h}
                        onClick={() => updateLook({ hair: h })}
                        aria-pressed={selected.look.hair === h}
                        className={`rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors ${
                          selected.look.hair === h
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        {HAIR_LABELS[h]}
                      </button>
                    ))}
                  </div>
                </div>

                <Swatches
                  label="Hair color"
                  colors={HAIR_COLORS}
                  value={selected.look.hairColor}
                  onChange={(hairColor) => updateLook({ hairColor })}
                />

                <div>
                  <Label className="text-xs text-muted-foreground">Outfit</Label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {OUTFIT_STYLES.map((o) => (
                      <button
                        key={o}
                        onClick={() => updateLook({ outfit: o })}
                        aria-pressed={selected.look.outfit === o}
                        className={`rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors ${
                          selected.look.outfit === o
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        {OUTFIT_LABELS[o]}
                      </button>
                    ))}
                  </div>
                </div>

                <Swatches
                  label="Outfit color"
                  colors={CLOTH_COLORS}
                  value={selected.look.outfitColor}
                  onChange={(outfitColor) => updateLook({ outfitColor })}
                />

                <Swatches
                  label="Pants color"
                  colors={PANTS_COLORS}
                  value={selected.look.pantsColor}
                  onChange={(pantsColor) => updateLook({ pantsColor })}
                />

                <label className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                  <span className="flex items-center gap-2 text-sm">
                    <UserRound className="size-4 text-primary" /> Glasses
                  </span>
                  <Switch
                    checked={selected.look.glasses}
                    onCheckedChange={(glasses) => updateLook({ glasses })}
                    aria-label="Toggle glasses"
                  />
                </label>

                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Volume2 className="size-4 text-primary" /> Voice
                  </p>
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">Browser voice</Label>
                    <Select
                      value={selected.voice.voiceURI || 'default'}
                      onValueChange={(v) =>
                        update({ voice: { ...selected.voice, voiceURI: v === 'default' ? '' : v } })
                      }
                    >
                      <SelectTrigger className="mt-1.5 w-full text-xs">
                        <SelectValue placeholder="System default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default" className="text-xs">
                          System default
                        </SelectItem>
                        {voices.map((v) => (
                          <SelectItem key={v.voiceURI} value={v.voiceURI} className="text-xs">
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pitch</span>
                      <span>{selected.voice.pitch.toFixed(2)}</span>
                    </div>
                    <Slider
                      className="mt-2"
                      min={0.5}
                      max={1.6}
                      step={0.01}
                      value={[selected.voice.pitch]}
                      onValueChange={([pitch]) => update({ voice: { ...selected.voice, pitch } })}
                      aria-label="Voice pitch"
                    />
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Speed</span>
                      <span>{selected.voice.rate.toFixed(2)}×</span>
                    </div>
                    <Slider
                      className="mt-2"
                      min={0.6}
                      max={1.5}
                      step={0.01}
                      value={[selected.voice.rate]}
                      onValueChange={([rate]) => update({ voice: { ...selected.voice, rate } })}
                      aria-label="Voice speed"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full gap-2"
                    onClick={testVoice}
                  >
                    <Volume2 className="size-4" /> Test voice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Create an actor to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
