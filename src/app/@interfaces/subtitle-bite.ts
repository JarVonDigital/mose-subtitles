export interface SubtitleBite {
  id: number;
  sTime: number;
  eTime: number;
  sTimeFormatted: string;
  eTimeFormatted: string;
  utterance: string;
  languages: any;
  isActive?: boolean;
}
