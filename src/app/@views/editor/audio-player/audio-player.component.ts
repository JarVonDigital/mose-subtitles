import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Subtitle} from '../../../@interfaces/subtitle';
import {Howl} from 'howler';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss']
})
export class AudioPlayerComponent implements OnInit {

  @Input() audioControl: Howl;
  @Input() activeSubtitleFile: Subtitle;
  @Input() currentAudioTime: number;

  @Output() playAudio: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() pauseAudio: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() muteAudio: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() seekAudio: EventEmitter<number> = new EventEmitter<number>();
  @Output() changeSubtitleLanguage: EventEmitter<any> = new EventEmitter();
  @Output() generateSRT: EventEmitter<any> = new EventEmitter();

  public subtitleLanguage: 'en' | 'es' = 'en';

  public isPlaying = false;
  public isMuted = false;

  ngOnInit(): void {
  }

  onPlayAudio() {
    this.isPlaying = true;
    this.playAudio.emit(true);
  };
  onPauseAudio() {
    this.isPlaying = false;
    this.pauseAudio.emit(true);
  };
  onMuteAudio() {
    this.isMuted = !this.isMuted;
    this.muteAudio.emit(this.isMuted);
  };

  onSeekAudio($event: any) { this.seekAudio.emit($event.target.value as number); }

  onChangeSubtitleLanguage() {
    this.subtitleLanguage = this.subtitleLanguage === 'en' ? 'es' :'en';
    this.changeSubtitleLanguage.emit();
  }

  onGenerateSRT(srt: 'ALL' | 'SRT' | 'JSON') {
    this.generateSRT.emit(srt);
  }
}
