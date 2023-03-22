import {SubtitleBite} from './subtitle-bite';

export interface Subtitle {
  title: string;
  location: string;
  created: Date;
  subtitles: SubtitleBite[];
}
