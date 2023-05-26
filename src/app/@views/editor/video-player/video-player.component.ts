import {Component, Input, OnInit} from '@angular/core';
import {SubtitleBite} from '../../../@interfaces/subtitle-bite';
import {SafeUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {

  @Input() videoURL: SafeUrl;
  @Input() activeSubtitle: SubtitleBite;
  @Input() language: 'en' | 'es' = 'en';

  // Booleans
  public showSubtitle = true;

  ngOnInit(): void {}

}
