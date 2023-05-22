import {SubtitleBite} from './subtitle-bite';

export interface Subtitle {
  title: string;
  assignedTo?: string;
  isLocked?: boolean;
  isCloudEnabled?: boolean;
  location: string;
  created: Date;
  subtitles: SubtitleBite[];
}
