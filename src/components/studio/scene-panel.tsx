'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BACKGROUNDS } from '@/lib/backgrounds';
import { SvgInline } from '@/components/svg-inline';
import type { CameraType, Shot, TransitionType } from '@/lib/types';

export type PatchShot = (fn: (shot: Shot) => Shot) => void;

export function BgPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2">
      {BACKGROUNDS.map((bg) => (
        <button
          key={bg.id}
          onClick={() => onChange(bg.id)}
          aria-pressed={bg.id === value}
          className={`group overflow-hidden rounded-lg border text-left transition-colors ${
            bg.id === value
              ? 'border-primary ring-2 ring-primary/40'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="h-14 w-full">
            <SvgInline svg={bg.svg()} className="thumb-svg h-full w-full" />
          </div>
          <p className="truncate px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {bg.name}
          </p>
        </button>
      ))}
    </div>
  );
}

const CAMERA_LABELS: Record<CameraType, string> = {
  wide: 'Wide shot',
  closeup: 'Close-up on speaker',
  zoom: 'Slow zoom in',
};

const TRANSITION_LABELS: Record<TransitionType, string> = {
  cut: 'Cut (instant)',
  fade: 'Fade from black',
  slide: 'Slide in',
};

export function ScenePanel({ shot, patch }: { shot: Shot; patch: PatchShot }) {
  return (
    <div className="flex flex-col gap-4">
      {shot.kind === 'title' ? (
        <>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <Label className="text-sm">Title card</Label>
              <p className="text-xs text-muted-foreground">Big text over a scene</p>
            </div>
            <Switch
              checked
              onCheckedChange={(v) => patch((s) => ({ ...s, kind: v ? 'title' : 'scene' }))}
              aria-label="Toggle title card"
            />
          </div>
          <div>
            <Label htmlFor="shot-title">Title</Label>
            <Input
              id="shot-title"
              className="mt-1.5"
              value={shot.title}
              onChange={(e) => patch((s) => ({ ...s, title: e.target.value }))}
              placeholder="Once upon a time…"
            />
          </div>
          <div>
            <Label htmlFor="shot-subtitle">Subtitle</Label>
            <Input
              id="shot-subtitle"
              className="mt-1.5"
              value={shot.subtitle}
              onChange={(e) => patch((s) => ({ ...s, subtitle: e.target.value }))}
              placeholder="A little story about…"
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <div>
            <Label className="text-sm">Scene shot</Label>
            <p className="text-xs text-muted-foreground">Actors play on a background</p>
          </div>
          <Switch
            checked={false}
            onCheckedChange={(v) => patch((s) => ({ ...s, kind: v ? 'title' : 'scene' }))}
            aria-label="Toggle title card"
          />
        </div>
      )}

      <div>
        <Label className="text-sm">Background</Label>
        <div className="mt-2">
          <BgPicker
            value={shot.backgroundId}
            onChange={(id) => patch((s) => ({ ...s, backgroundId: id }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label className="text-sm">Camera</Label>
          <Select
            value={shot.camera}
            onValueChange={(v) => patch((s) => ({ ...s, camera: v as CameraType }))}
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CAMERA_LABELS) as CameraType[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CAMERA_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Entrance transition</Label>
          <Select
            value={shot.transition}
            onValueChange={(v) => patch((s) => ({ ...s, transition: v as TransitionType }))}
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TRANSITION_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-xs text-muted-foreground"
        onClick={() =>
          patch((s) => ({
            ...s,
            kind: s.kind === 'title' ? 'scene' : 'title',
            title: s.kind === 'title' ? s.title : 'New title card',
          }))
        }
      >
        Convert shot to {shot.kind === 'title' ? 'scene' : 'title card'}
      </Button>
    </div>
  );
}
