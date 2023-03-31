import {SubtitleBite} from './subtitle-bite';

export interface Subtitle {
  title: string;
  isCloudEnabled?: boolean;
  location: string;
  created: Date;
  subtitles: SubtitleBite[];
}
