"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const mose_1 = require("./mose");
const child_process_1 = require("child_process");
const url = __importStar(require("url"));
const platform_folders_1 = require("platform-folders");
let translateServer;
let win = null;
const args = process.argv.slice(1), serve = args.some(val => val === '--serve');
let systemFileWatcher;
function createWindow() {
    const size = electron_1.screen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    win = new electron_1.BrowserWindow({ width: size.width - 100,
        height: size.height - 100,
        webPreferences: {
            nodeIntegration: true,
            allowRunningInsecureContent: (serve),
            contextIsolation: false, // false if you want to run e2e test with Spectron
        },
        title: "WTS | Subtitles"
    });
    win.center();
    if (serve) {
        const debug = require('electron-debug');
        debug();
        require('electron-reloader')(module);
        win.loadURL('http://localhost:4200');
    }
    else {
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
function stripFileExtension(file) {
    let withoutFileExtension = file.split('.');
    withoutFileExtension.pop();
    return [
        file,
        withoutFileExtension.join('')
    ];
}
function removeSystemFilesFromArray(videoFiles) {
    const filesToRemove = ['.DS_Store'];
    const newlyDefinedArray = [];
    videoFiles.forEach((file) => !filesToRemove.includes(file) ? newlyDefinedArray.push(stripFileExtension(file)) : null);
    return newlyDefinedArray;
}
function doRunFileChecker() {
    // Get Video Files On System
    let videoFiles = removeSystemFilesFromArray(fs.readdirSync(path.join((0, platform_folders_1.getDocumentsFolder)(), '@JWVT', 'videos')));
    // Get Audio Files on system
    let audioFiles = removeSystemFilesFromArray(fs.readdirSync(path.join((0, platform_folders_1.getDocumentsFolder)(), '@JWVT', 'audio')));
    let audioFilesWithoutExtension = [];
    audioFiles.forEach(audio => audioFilesWithoutExtension.push(audio[1]));
    videoFiles.forEach(file => {
        let videoFileWithNoExtension = file[1];
        if (!audioFilesWithoutExtension.includes(videoFileWithNoExtension)) {
            console.log(file);
            // At this point we need to run our local parser to create the audio file
            let commandToRun = `cd ${path.join((0, platform_folders_1.getDocumentsFolder)(), '@JWVT', 'SYSTEM', 'core', 'MOSE-TOOLS')} && node index.js [${file[0]}]`;
            console.log(commandToRun);
            (0, child_process_1.execSync)(commandToRun); // Execute Command
            // Create JSON File
            (0, mose_1.generateSubtitles)(file[0], "JSON")
                .catch(err => console.log(err));
        }
    });
}
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    electron_1.app.on('ready', () => {
        electron_1.protocol.registerFileProtocol('mose', (req, callback) => {
            const filePath = url.fileURLToPath(`file://${req.url.slice('mose://'.length)}`);
            callback(filePath);
        });
        // Create Window
        createWindow();
    });
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
    electron_1.app.on("will-quit", () => {
        // Kill Translate Server
        translateServer.kill('SIGTERM');
    });
    // Handlers
    electron_1.ipcMain.handle("getSingleFile", (ev, arg) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, mose_1.getSingleFile)(arg[0], arg[1]); }));
    electron_1.ipcMain.handle("getFolderContent", (ev, arg) => __awaiter(void 0, void 0, void 0, function* () { return (0, mose_1.getFolderContent)(arg); }));
    electron_1.ipcMain.handle("generateSubtitles", (ev, saveLoc, filesToCreate) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, mose_1.generateSubtitles)(saveLoc, filesToCreate); }));
    electron_1.ipcMain.handle("convertSubtitles", (ev, arg) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, mose_1.convertSubtitles)(arg[0], arg[1]); }));
    electron_1.ipcMain.handle("saveSubtitleFile", (ev, fileName, subtitle) => __awaiter(void 0, void 0, void 0, function* () { return (0, mose_1.writeJsonSubtitleFile)(subtitle, fileName); }));
    electron_1.ipcMain.handle("getDocumentsDirectory", (ev, arg) => __awaiter(void 0, void 0, void 0, function* () { return (0, platform_folders_1.getDocumentsFolder)(); }));
    electron_1.ipcMain.handle('initAVServices', (ev) => __awaiter(void 0, void 0, void 0, function* () {
        let data = yield new Promise((res, rej) => {
            // Check Folder Exist
            let verifySystem = fs.existsSync(path.join((0, platform_folders_1.getDocumentsFolder)(), '@JWVT', 'SYSTEM', '.mose'));
            // Start File watcher
            let toProceedWithAction;
            if (systemFileWatcher !== undefined)
                systemFileWatcher.close();
            systemFileWatcher = fs.watch(path.join((0, platform_folders_1.getDocumentsFolder)(), '@JWVT', 'videos'), (event, file) => {
                if (toProceedWithAction)
                    clearTimeout(toProceedWithAction);
                // Prevent Window from being closed while operations are happening
                win.closable = false;
                // Proceed with any actions relating to file
                toProceedWithAction = setTimeout(() => {
                    // This is where we will handle new data
                    doRunFileChecker();
                    // Allow Window to be closed after operation
                    win.closable = true;
                }, 5000);
            });
            if (verifySystem) {
                res(true);
            }
            else {
                res(false);
            }
        });
        return data;
    }));
}
catch (e) {
    // Catch Error
    // throw e;
}
//# sourceMappingURL=main.js.map