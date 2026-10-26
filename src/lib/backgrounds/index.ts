import * as Indoor from './indoor';
import * as Outdoor from './outdoor';

export interface BackgroundDef {
  id: string;
  name: string;
  category: 'Indoor' | 'Outdoor' | 'Special';
  /** Returns an SVG string at 1280x720 */
  svg: () => string;
}

function def(
  id: string,
  name: string,
  category: BackgroundDef['category'],
  svg: () => string
): BackgroundDef {
  return { id, name, category, svg };
}

export const BACKGROUNDS: BackgroundDef[] = [
  def('living-room', 'Living Room', 'Indoor', Indoor.livingRoom),
  def('bedroom', 'Bedroom', 'Indoor', Indoor.bedroom),
  def('classroom', 'Classroom', 'Indoor', Indoor.classroom),
  def('office', 'Office', 'Indoor', Indoor.office),
  def('cafe', 'Café', 'Indoor', Indoor.cafe),
  def('spaceship', 'Spaceship', 'Special', Indoor.spaceship),
  def('city-day', 'City Street (Day)', 'Outdoor', Outdoor.cityDay),
  def('city-night', 'City Street (Night)', 'Outdoor', Outdoor.cityNight),
  def('park', 'Park', 'Outdoor', Outdoor.park),
  def('beach', 'Beach', 'Outdoor', Outdoor.beach),
  def('stage', 'Spotlight Stage', 'Special', Outdoor.stage),
  def('sunset-hill', 'Sunset Hill', 'Outdoor', Outdoor.sunsetHill),
];

export const BACKGROUND_MAP: Record<string, BackgroundDef> = Object.fromEntries(
  BACKGROUNDS.map((b) => [b.id, b])
);

export function getBackground(id: string): BackgroundDef {
  return BACKGROUND_MAP[id] ?? BACKGROUNDS[0];
}

export const BG_SVG_W = 1280;
export const BG_SVG_H = 720;
