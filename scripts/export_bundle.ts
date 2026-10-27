// Export the "Max & Rex" story as a StoryForge project bundle for import.
import { writeFileSync } from 'node:fs';
import { buildMaxRexProject, STORY_CHARACTERS } from '../src/lib/story-max-rex';

const bundle = {
  kind: 'storyforge-project',
  version: 2,
  project: buildMaxRexProject(),
  characters: STORY_CHARACTERS,
};
writeFileSync('/home/z/my-project/download/max-and-rex-story.storyforge.json', JSON.stringify(bundle, null, 2));
console.log('bundle exported');
