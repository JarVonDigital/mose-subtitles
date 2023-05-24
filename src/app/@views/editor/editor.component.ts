import { Component, inject, OnInit} from '@angular/core';
import {ElectronService} from '../../core/services';
import {Howl} from 'howler';
import {Subtitle} from '../../@interfaces/subtitle';
import {SubtitleBite} from '../../@interfaces/subtitle-bite';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {SubtitleService} from '../../@services/subtitle/subtitle.service';
import {animate, stagger, style, transition, trigger, query as animationQuery} from '@angular/animations';
import {AuthService} from '../../@services/auth/auth.service';

interface FileContainer {
  original: string;
  clean: string;
}

const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    animationQuery(':enter',
      [style({ opacity: 0 }), stagger('60ms', animate('600ms ease-out', style({ opacity: 1 })))],
      { optional: true }
    ),
    animationQuery(':leave',
      animate('200ms', style({ opacity: 0 })),
      { optional: true }
    )
  ])
]);

const listFadeInAnimation = trigger('listFadeInAnimation', [
  transition('* <=> *', [
    animationQuery(':enter',
      [style({ opacity: 0 }), stagger('60ms', animate('600ms ease-out', style({ opacity: .5 })))],
      { optional: true }
    ),
    animationQuery(':leave',
      animate('200ms', style({ opacity: 0 })),
      { optional: true }
    )
  ])
]);

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  animations:[
    listAnimation,
    listFadeInAnimation
  ]
})
export class EditorComponent implements OnInit {

  public files: FileContainer[];
  public cloudFiles: Subtitle[];
  public selectedFile: FileContainer;
  public workingFile: Subtitle;

  public isSrt = false;
  public isJson = false;
  public isPlaying = false;
  public showVideo = false;
  public showSubtitle = false;
  public updatingNumber = 1;
  isTranslating = false;
  isTranslationHidden = false;
  isUploading = false;

  public sound: Howl;
  public videoPlayer: HTMLVideoElement;

  public availableVideoFiles: string[];
  public currentSoundTime: number;
  public activeSubtitle: SubtitleBite;
  public time: NodeJS.Timer;
  public formattedCurrentTime: string;
  public subtitleLanguage: 'en' | 'es' = 'en';
  public documentURL: string;
  public videoURL: SafeUrl;
  public unavailableLocal: Subtitle[];

  uploadedFile: undefined;

  // NodeJS
  protected path = window.require('path');

  protected authService: AuthService = inject(AuthService);

  // Injectors
  private app: ElectronService = inject(ElectronService);
  private http: HttpClient = inject(HttpClient);
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private subtitleService: SubtitleService = inject(SubtitleService);

  async ngOnInit(): Promise<void> {

    try {
      this.documentURL = await this.app.getDocumentsDirectory();

      // Get subtitles from cloud
      this.cloudFiles = await this.subtitleService.getSubtitleFiles();

      // Load folder content once complete
      await this.loadFolderContent();

    } catch (err) { console.log(err); }

  }

  loadContent(parseFileName?, index?: number) {


    this.selectedFile = parseFileName ? parseFileName : this.selectedFile;

    // Reset Default Values for variables
    this.isSrt = false;
    this.isJson = false;
    this.showVideo = false;
    this.showSubtitle = false;

    this.videoURL = '';

    this.workingFile = this.cloudFiles.filter(file => file.title === parseFileName.clean)[0];

    if(this.workingFile) {
      this.initSound();
    }

  }

  initSound() {

    this.showVideo = true;
    this.showSubtitle = false;

    const audioURL = this.path.join(this.documentURL, '@JWVT', 'audio', `${this.workingFile.title}.mp3`);

    // Setup Sound Source
    this.sound = new Howl({
      src: [`mose://${audioURL}`]
    });

    // // Setup Video File
    this.videoURL = this.sanitizer.bypassSecurityTrustUrl(
      `mose://${this.documentURL}/@JWVT/videos/${this.workingFile.location}`
    );

    // Handle : SOUND PLAYING
    this.sound.on('play', () => {
      this.isPlaying = this.sound.playing();
      this.showSubtitle = true; // Show Subtitle on screen

      // Set Defaults
      let currentSelected = -1;

      this.time = setInterval(() => {
        this.currentSoundTime = this.sound.seek();
        this.formattedCurrentTime = new Date(this.currentSoundTime * 1000).toISOString().substring(11, 19);
        this.workingFile.subtitles.forEach((subtitle, index) => {
          if (this.thisSubtitleActive(subtitle)) {
            if (currentSelected !== index) {
              currentSelected = index;
              subtitle.isActive = true;
              this.activeSubtitle = subtitle;
              this.scrollTo(index);
            }
          } else {
            subtitle.isActive = false;
          }
        });
      }, 0);
    });

    // Handle : SOUND PAUSE
    this.sound.on('pause', () => {
      clearInterval(this.time);
      this.isPlaying = this.sound.playing();
    });
  }

  regenerateSubtitle(type: 'ALL' | 'SRT' | 'JSON') {

    let toProceed = false;

    // eslint-disable-next-line max-len
    if (type === 'JSON') {
      // eslint-disable-next-line max-len
      toProceed = window.confirm('This will delete any working files along with translations. Are you sure you want to proceed with this action?');
    }

    if (toProceed || type === 'SRT') {

      console.log(`data: ${this.selectedFile.original}`);
      console.log('Currently regenerating Subtitle JSON for: ${}');
      this.app.regenerateSubtitle(this.selectedFile.original, type)
        .then(res => {
          this.loadContent();
          window.alert('Your SRT file has been saved @ documents/JWVT/subtitles under the correct language.');
        });
    }

  }

  play() {
    if (this.sound.playing()) {
      this.videoPlayer.pause();
      this.sound.pause();
    } else {
      const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement;
      videoPlayer.play();
      this.sound.play();
    }
  }

  pause() {
    const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement;
    videoPlayer.pause();
    this.sound.pause();
  }

  muteAudio($event: boolean) { this.sound.mute($event); }

  thisSubtitleActive(subtitle: SubtitleBite) {
    const overTime = (this.currentSoundTime > subtitle.sTime);
    const underTime = (this.currentSoundTime < subtitle.eTime);
    return (overTime && underTime);
  }

  playFrom(sTime: any, toPlayAfter = true) {

    const videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement;

    videoPlayer.pause();
    this.sound.stop();

    videoPlayer.currentTime = (sTime - 0.50);
    this.sound.seek((sTime - 0.60));

    if (toPlayAfter) {
      videoPlayer.play()
        .then(() => this.sound.play());
    }


  }

  onChangeRange($event: any) {
    this.sound.pause();
    this.playFrom($event.target.value, false);
  }

  scrollTo(id) {
    const currentElement = document.querySelector(`#sub-${id}`) as HTMLElement;
    currentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  translateText(subtitle: SubtitleBite) {
    let isConfirmed = false;

    if (subtitle.languages.es) {
      isConfirmed = window.confirm('Would you like to translate this file again?');
    } else {
      isConfirmed = true;
    }

    if (isConfirmed) {
      this.http.post(`http://103-89-12-225.cloud-xip.com:5000/translate`,
        {
          q: subtitle.utterance,
          source: 'en',
          target: 'es',
          format: 'text',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          api_key: ''
        },
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: {'Content-Type': 'application/json'}
        }).subscribe((data: any) => {
        subtitle.languages.es = data.translatedText;
        this.onSaveSubtitle();
      });
    }

  }

  async translateAllText() {
    if(!window.confirm('Translate all subtitles?')) {return;}
    this.updatingNumber = 1;
    this.isTranslating = true;
    for (const subtitle of this.workingFile.subtitles) {
      const translation = await this.http.post<any>(`http://103-89-12-225.cloud-xip.com:5000/translate`,
        {
          q: subtitle.utterance,
          source: 'en',
          target: 'es',
          format: 'text',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          api_key: ''
        },
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: {'Content-Type': 'application/json'}
        }).toPromise();

      subtitle.languages.es = translation.translatedText;
      this.updatingNumber++;
    }

    this.isTranslating = false;
    window.alert(`Translation Complete: ${this.updatingNumber - 1}/${this.workingFile.subtitles.length}`);
  }

  onChangeSubtitleLanguage() {
    this.subtitleLanguage = this.subtitleLanguage === 'en' ? 'es' : 'en';
  }

  async onSaveSubtitle() {

    try {
      if(this.authService.validateUser().isLoggedIn) {
        this.workingFile.title = this.selectedFile.clean;
        await this.subtitleService.saveSubtitleFile(this.workingFile);
        window.alert(`Working File Saved @ ${new Date()}!`);
      } else {
        window.alert('Oops, please login before uploading...');
      }
    } catch (err) { console.log(err); }

  }

  onDeleteSubtitle(id: number, shiftUp = false, subtitle?: SubtitleBite) {

    const confirmDeletion = window.confirm(`Are you sure you want to delete subtitle: ${subtitle.utterance}`);

    // First Subtitle In Array
    if (id === 0) {

      if (confirmDeletion) {
        this.workingFile.subtitles[(id + 1)].sTime = this.workingFile.subtitles[id].sTime;
        this.workingFile.subtitles[(id + 1)].sTimeFormatted = this.workingFile.subtitles[id].sTimeFormatted;
        // eslint-disable-next-line max-len
        this.workingFile.subtitles[(id + 1)].utterance = `${this.workingFile.subtitles[id].utterance} ${this.workingFile.subtitles[(id + 1)].utterance}`;
        this.workingFile.subtitles.splice(id, 1);
      }

    }

    // Last Subtitle In Array
    else if (id === (this.workingFile.subtitles.length - 1)) {

      // Last Subtitle In Array
      if (confirmDeletion) {
        this.workingFile.subtitles[(id - 1)].eTime = this.workingFile.subtitles[id].eTime;
        this.workingFile.subtitles[(id - 1)].eTimeFormatted = this.workingFile.subtitles[id].eTimeFormatted;
        // eslint-disable-next-line max-len
        this.workingFile.subtitles[(id - 1)].utterance = `${this.workingFile.subtitles[(id - 1)].utterance} ${this.workingFile.subtitles[id].utterance}`;
        this.workingFile.subtitles.splice(id, 1);
      }

    }

    // Every other subtitle in array
    else {

      if (confirmDeletion) {

        if (shiftUp) {
          this.workingFile.subtitles[(id - 1)].eTime = this.workingFile.subtitles[id].eTime;
          this.workingFile.subtitles[(id - 1)].eTimeFormatted = this.workingFile.subtitles[id].eTimeFormatted;
          // eslint-disable-next-line max-len
          this.workingFile.subtitles[(id - 1)].utterance = `${this.workingFile.subtitles[(id - 1)].utterance} ${this.workingFile.subtitles[id].utterance}`;
          this.workingFile.subtitles.splice(id, 1);
        } else {
          this.workingFile.subtitles[(id + 1)].sTime = this.workingFile.subtitles[id].sTime;
          this.workingFile.subtitles[(id + 1)].sTimeFormatted = this.workingFile.subtitles[id].sTimeFormatted;
          // eslint-disable-next-line max-len
          this.workingFile.subtitles[(id + 1)].utterance = `${this.workingFile.subtitles[id].utterance} ${this.workingFile.subtitles[(id + 1)].utterance}`;
          this.workingFile.subtitles.splice(id, 1);
        }

      }

    }

  }
  onToggleTranslation() {
    this.isTranslationHidden = !this.isTranslationHidden;
  }

  onSplitSubtitle(id: number) {
    const curSub = this.workingFile.subtitles[id];
    const nexSub = this.workingFile.subtitles[id + 1];

    const endSubtitle = curSub.eTime;
    const endSubtitleFormatted = curSub.eTimeFormatted;

    // new end time of current subtitle
    const splitTime =  curSub.eTime - ((curSub.eTime - curSub.sTime) / 2);
    const splitTimeFormatted = new Date(splitTime * 1000)
      .toISOString()
      .substr(11, 12)
      .replace('.', ',');

    const splitText = curSub.utterance.split(' ');
    const amountToSplit = Math.round(splitText.length / 2);
    let counter = 0;
    const newUtteranceArray = [];

    while(counter < splitText.length) {
      if(counter >= amountToSplit) {
        newUtteranceArray.push(splitText[counter]);
      }
      counter++;
    }

    const newUtterance = newUtteranceArray.join(' ');

    // Cleanup Original Subtitle
    curSub.eTime = splitTime;
    curSub.eTimeFormatted = splitTimeFormatted;
    curSub.utterance = curSub.utterance.split(newUtterance)[0];
    curSub.languages = {};

    // Create New Subtitle and insert
    this.workingFile.subtitles
      .splice(id + 1, 0, {
        id: (curSub.id + 0.1),
        sTime: splitTime,
        eTime: endSubtitle,
        sTimeFormatted: splitTimeFormatted,
        eTimeFormatted: endSubtitleFormatted,
        languages: {},
        utterance: newUtterance
      });

    this.onSaveSubtitle();

  }

  async onSelectMediaToUpload() {

    if(this.authService.validateUser().isLoggedIn) {
      this.isUploading = true;
      this.uploadedFile = undefined;
      const fileData = await this.app.ipcRenderer.invoke('selectMediaToUpload');

      if(fileData) {

        // Uploaded File
        this.uploadedFile = fileData.json;

        // Notify User that file has been
        window.alert(`Working file has been created for video located at: ${fileData.json.location}`);

        // Subtitle file
        await this.subtitleService.saveSubtitleFile(fileData.json);

        // Run init again
        await this.ngOnInit();

      }

      this.isUploading = false;

    } else {
      window.alert('Oops, please login before uploading...');
      return;
    }

  }

  getOriginal(location) {
    return this.path.parse(location).base;
  }

  checkLocalAvailability(cloudFiles: Subtitle[], returnUnavailable = false): Subtitle[] {

    this.unavailableLocal = [];

    const sortedAvailableFiles = this.cloudFiles.filter((file) => {
      const numberOfVideosLocal = this.availableVideoFiles.filter((avf) => this.path.parse(avf).name === file.title);

      if(numberOfVideosLocal.length > 0) {
        return true;
      } else {
        this.unavailableLocal.push(file);
        return false;
      }

    });

    return returnUnavailable ? this.unavailableLocal : sortedAvailableFiles;

  }

  private async loadFolderContent() {

    // Get video files
    this.availableVideoFiles = await this.app.getFolderContent('video');

    // Array for clean file names
    const cleanFileNames = [];

    for (const video of this.availableVideoFiles) {
      const videoFileName = this.path.parse(video).name;
      if (videoFileName !== '.DS_Store') {
        if (!cleanFileNames.includes(videoFileName)) {
          cleanFileNames.push({
            clean: videoFileName,
            original: video
          });
        }
      }
    }

    this.files = cleanFileNames;
    this.selectedFile = cleanFileNames[0];
    this.loadContent();
  }
}
