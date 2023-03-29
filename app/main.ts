import {app, BrowserWindow, screen, ipcMain, protocol, dialog} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import {
  convertSubtitles,
  generateSubtitles,
  getFolderContent,
  getSingleFile,
  writeJsonSubtitleFile
} from "./mose";

import {ChildProcess, execSync, spawn} from "child_process";
import * as url from "url";
import {Subtitle} from "../src/app/@interfaces/subtitle";
import {getDocumentsFolder} from "platform-folders";
import {copyFileSync, FSWatcher} from "fs";
import {COPYFILE_FICLONE} from "constants";

let translateServer: ChildProcess;

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

let systemFileWatcher: FSWatcher;

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({width: size.width - 100,
    height: size.height - 100,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,  // false if you want to run e2e test with Spectron
    },
    title: "WTS | Subtitles"
  });

  win.center();

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

function stripFileExtension(file: string) {

  let withoutFileExtension = file.split('.')
      withoutFileExtension.pop()

  return [
    file,
    withoutFileExtension.join('')
  ]
}

function removeSystemFilesFromArray(videoFiles: string[]) {
  const filesToRemove = ['.DS_Store']
  const newlyDefinedArray = [];
  videoFiles.forEach((file) => !filesToRemove.includes(file) ? newlyDefinedArray.push(stripFileExtension(file)) : null);
  return newlyDefinedArray;
}

async function doRunFileChecker() {

  // Get Video Files On System
  let videoFiles = removeSystemFilesFromArray(
    fs.readdirSync(
      path.join(getDocumentsFolder(), '@JWVT', 'videos')
    )
  );

  // Get Audio Files on system
  let audioFiles = removeSystemFilesFromArray(
    fs.readdirSync(
      path.join(getDocumentsFolder(), '@JWVT', 'audio')
    )
  );

  let audioFilesWithoutExtension = [];
  for(let audio of audioFiles) {
    audioFilesWithoutExtension.push(audio[1]);
  }

  for(let file of videoFiles) {
    let videoFileWithNoExtension = file[1];
    if(!audioFilesWithoutExtension.includes(videoFileWithNoExtension)) {
      console.log(file);
      // At this point we need to run our local parser to create the audio file
      let commandToRun = `cd ${path.join(getDocumentsFolder(), '@JWVT', 'SYSTEM', 'core', 'MOSE-TOOLS')} && node index.js [${file[0]}]`;
      console.log(commandToRun);
      execSync(commandToRun); // Execute Command
      // Create JSON File
      await generateSubtitles(file[0], "JSON")
    }
  }
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {

    protocol.registerFileProtocol('mose', (req, callback) => {
      const filePath = url.fileURLToPath(`file://${req.url.slice('mose://'.length)}`);
      callback(filePath);
    })

    // Create Window
    createWindow()

  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  app.on("will-quit", () => {})

  // Handlers
  ipcMain.handle("getSingleFile", async (ev, arg) => await getSingleFile(arg[0], arg[1]))
  ipcMain.handle("getFolderContent", async (ev, arg) => getFolderContent(arg))
  ipcMain.handle("generateSubtitles", async (ev, saveLoc, filesToCreate) => await generateSubtitles(saveLoc, filesToCreate))
  ipcMain.handle("convertSubtitles", async (ev, arg) => await convertSubtitles(arg[0], arg[1]))
  ipcMain.handle("saveSubtitleFile", async (ev, fileName: string, subtitle: Subtitle) => writeJsonSubtitleFile(subtitle, fileName))
  ipcMain.handle("getDocumentsDirectory", async (ev, arg) => getDocumentsFolder())

  ipcMain.handle('initAVServices', async (ev) => {
    let data = await new Promise((res, rej) => {

      // Check Folder Exist
      let verifySystem = fs.existsSync(path.join(getDocumentsFolder(), '@JWVT', 'SYSTEM', '.mose'));

      // // Start File watcher
      // let toProceedWithAction: Timeout;
      // if(systemFileWatcher !== undefined) systemFileWatcher.close();
      // systemFileWatcher = fs.watch(path.join(getDocumentsFolder(), '@JWVT', 'videos'), (event, file) => {
      //   if(toProceedWithAction) clearTimeout(toProceedWithAction);
      //
      //   // Prevent Window from being closed while operations are happening
      //   win.closable = false;
      //
      //   // Proceed with any actions relating to file
      //   toProceedWithAction = setTimeout(() => {
      //     // This is where we will handle new data
      //     doRunFileChecker()
      //
      //     // Allow Window to be closed after operation
      //     win.closable = true;
      //   }, 5000);
      //
      //
      // })

      if(verifySystem) {
        res(true);
      } else {
        res(false);
      }

    })

    return data;
  })

  // Handle Media Upload
  ipcMain.handle("selectMediaToUpload", async (ev, arg) => {
    let fileLocation = dialog.showOpenDialogSync({
      title: "MOSE | Upload Media",
      buttonLabel: "Upload Media",
      properties: ["openFile", "noResolveAliases", "treatPackageAsDirectory"],
      filters: [
        {
          name: "Videos",
          extensions: [".mp4"]
        }
      ]
    })

    // File Selected
    if(fileLocation) {
      let fileName = path.parse(fileLocation[0]).name + path.parse(fileLocation[0]).ext;
      copyFileSync(fileLocation[0], path.join(getDocumentsFolder(), '@JWVT', 'videos', fileName), COPYFILE_FICLONE)
      win.closable = false;
      await doRunFileChecker();
      win.closable = true;
    }

    return fileLocation;
  })

} catch (e) {
  // Catch Error
  // throw e;
}
