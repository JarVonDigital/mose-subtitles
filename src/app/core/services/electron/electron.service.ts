import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, dialog, MessageBoxOptions, MessageBoxReturnValue} from 'electron';
import * as fs from 'fs';
import {Subtitle} from '../../../@interfaces/subtitle';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  fs: typeof fs;
  dialog: typeof dialog;

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.dialog = window.require('electron').dialog;
      this.fs = window.require('fs');

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  public getFolderContent(type: string) {
    return this.ipcRenderer.invoke('getFolderContent', type);
  }

  public getSingleFile(mediaType = 'SUBTITLE', cleanFileName: string) {
    return this.ipcRenderer.invoke('getSingleFile', [mediaType, cleanFileName]);
  }

  public regenerateSubtitle(workingFile: any, type: 'ALL' | 'SRT' | 'JSON') {
    return this.ipcRenderer.invoke('generateSubtitles', workingFile, type);
  }

  public saveSubtitleFile(fileName: string, workingFile: Subtitle) {
    return this.ipcRenderer.invoke('saveSubtitleFile', fileName, workingFile);
  }

  public initAVServices() {
    return this.ipcRenderer.invoke('initAVServices');
  }

  public getDocumentsDirectory() {
    return this.ipcRenderer.invoke('getDocumentsDirectory');
  }

  async showMessageBox(options: MessageBoxOptions): Promise<MessageBoxReturnValue> {
    return await this.ipcRenderer.invoke('showMessageBox', options);
  }

  async showErrorBox(title: string, content: string) {
    return await this.ipcRenderer.invoke('showErrorBox', title, content);
  }
}
