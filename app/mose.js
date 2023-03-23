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
exports.convertSubtitles = exports.generateSubtitles = exports.writeJsonSubtitleFile = exports.getFolderContent = exports.getSingleFile = exports.genSrtFromTranscribe = exports.systemCheck = void 0;
// File System
const fs_1 = require("fs");
const path = __importStar(require("path"));
//require the ffmpeg package so we can use ffmpeg using JS
const ffmpeg = require('fluent-ffmpeg');
//Get the paths to the packaged versions of the binaries we want to use
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked');
//tell the ffmpeg package where it can find the needed binaries.
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
// Platform Folders
const platform_folders_1 = require("platform-folders");
// Deep Gram
const sdk_1 = require("@deepgram/sdk");
// Init items
let transcriber = new sdk_1.Deepgram("6b35dc4bce631821932e15d8aee5f113b01ceeae");
const fileInQuestion = path.join((0, platform_folders_1.getDocumentsFolder)(), "@JWVT");
const videoFolder = path.join(fileInQuestion, "videos");
const audioFolder = path.join(fileInQuestion, "audio");
const subtitlesFolder = path.join(fileInQuestion, "subtitles");
const systemFolder = path.join(fileInQuestion, "SYSTEM");
const coreFolder = path.join(fileInQuestion, "SYSTEM", "core");
/**
 *
 * Check if folder has been created to save videos and srt files
 * if folder doesn't exist then we need to create the folder
 *
 * @return void
 *
 */
function systemCheck(toPurge) {
    let itemsToCreate = [
        fileInQuestion,
        videoFolder,
        audioFolder,
        subtitlesFolder,
        systemFolder,
        coreFolder
    ];
    // Create System Files
    if (!(0, fs_1.existsSync)(fileInQuestion) && !toPurge) {
        itemsToCreate.forEach((folder) => (0, fs_1.mkdirSync)(folder));
        setTimeout(() => console.log(`Required Folders Generated @ ${fileInQuestion}`)), 2500;
        return;
    }
    // Purge System Files
    if ((0, fs_1.existsSync)(fileInQuestion) && toPurge) {
        (0, fs_1.rmSync)(fileInQuestion, { recursive: true, force: true });
        setTimeout(() => console.log(`System Purged @ ${new Date()}`), 2500);
        return;
    }
    // Log if there is nothing to be completed
    console.log("No action taken, please try again...");
}
exports.systemCheck = systemCheck;
/**
 *
 * @param response
 * @param options
 *
 * Generates both a JSON File & SRT File
 *
 */
function genSrtFromTranscribe(response, options = { title: '', location: '' }) {
    let string = "";
    let json = {
        title: options.title,
        location: options.location,
        created: new Date(),
        subtitles: []
    };
    for (let i = 0; i < response.results.utterances.length; i++) {
        const utterance = response.results.utterances[i];
        const start = new Date(utterance.start * 1000)
            .toISOString()
            .substr(11, 12)
            .replace('.', ',');
        const end = new Date(utterance.end * 1000)
            .toISOString()
            .substr(11, 12)
            .replace('.', ',');
        json.subtitles.push({ id: (i + 1), sTime: utterance.start, eTime: utterance.end, sTimeFormatted: start, eTimeFormatted: end, utterance: utterance.transcript, languages: {} });
        string += `${i + 1}\n${start} --> ${end}\n${utterance.transcript}\n\n`;
    }
    return {
        text: string,
        json: JSON.stringify(json, null, 4)
    };
}
exports.genSrtFromTranscribe = genSrtFromTranscribe;
function getSingleFile(mediaType, filename) {
    try {
        console.log(filename);
        // Media Types :: Passes as properties
        if (mediaType.toUpperCase() === 'AUDIO') {
            let data = (0, fs_1.readFileSync)(path.join(audioFolder, filename), { encoding: "utf8" });
            return data;
        }
        if (mediaType.toUpperCase() === 'SUBTITLE') {
            let data = (0, fs_1.readFileSync)(path.join(subtitlesFolder, filename), { encoding: "utf8" });
            return data;
        }
    }
    catch (err) {
        return err;
    }
}
exports.getSingleFile = getSingleFile;
function getFolderContent(folder) {
    if (folder.toUpperCase() === 'ROOT')
        return (0, fs_1.readdirSync)(fileInQuestion);
    if (folder.toUpperCase() === 'AUDIO')
        return (0, fs_1.readdirSync)(audioFolder);
    if (folder.toUpperCase() === 'VIDEO')
        return (0, fs_1.readdirSync)(videoFolder);
    if (folder.toUpperCase() === 'SUBTITLE')
        return (0, fs_1.readdirSync)(subtitlesFolder);
}
exports.getFolderContent = getFolderContent;
function writeJsonSubtitleFile(json, fileName) {
    let writeFile = (0, fs_1.createWriteStream)(path.join(subtitlesFolder, fileName), { flags: 'w' });
    writeFile.write(JSON.stringify(json, null, 4));
    writeFile.close();
    return true;
}
exports.writeJsonSubtitleFile = writeJsonSubtitleFile;
function genSrtFromJSON(json, language = 'en') {
    let string = "";
    if (language === 'en') {
        json.subtitles.forEach((subtitle, index) => {
            string += `${index + 1}\n${subtitle.sTimeFormatted} --> ${subtitle.eTimeFormatted}\n${subtitle.utterance}\n\n`;
        });
    }
    else {
        json.subtitles.forEach((subtitle, index) => {
            string += `${index + 1}\n${subtitle.sTimeFormatted} --> ${subtitle.eTimeFormatted}\n${subtitle.languages[language]}\n\n`;
        });
    }
    return string;
}
function generateSubtitles(saveLocation, filesToCreate = "") {
    return __awaiter(this, void 0, void 0, function* () {
        if (filesToCreate === "") {
            filesToCreate = "ALL";
        }
        let supportedLanguages = ['en', 'es'];
        try {
            let transcribe;
            // Log what's going on
            console.log(`Working on creating subtitles for \n - ${saveLocation}`);
            let audioLoc = saveLocation.split(".")[0] + '.mp3';
            let source = {
                stream: (0, fs_1.createReadStream)(path.join(audioFolder, audioLoc)),
                mimetype: 'audio/mp3'
            };
            if (filesToCreate === "ALL" || filesToCreate === "JSON") {
                transcribe = yield transcriber.transcription
                    .preRecorded(source, { times: false, punctuate: true, utterances: true });
            }
            if (!(0, fs_1.existsSync)(path.join(subtitlesFolder, 'english')))
                (0, fs_1.mkdirSync)(path.join(subtitlesFolder, 'english'));
            let srtSavePath = path.join(subtitlesFolder, 'english', `${saveLocation.split(".")[0]}.srt`);
            let jsonSavePath = path.join(subtitlesFolder, `${saveLocation.split(".")[0]}.json`);
            // SRT Filename
            if (filesToCreate === "ALL" || filesToCreate === "SRT") {
                const srtStream = (0, fs_1.createWriteStream)(srtSavePath, { flags: 'w' });
                if (filesToCreate === "ALL") {
                    srtStream.write(genSrtFromTranscribe(transcribe, { title: '', location: path.join(audioFolder, audioLoc) }).text);
                    srtStream.close();
                }
                else {
                    // Read JSON FILE
                    let jsonFile = (0, fs_1.readFileSync)(jsonSavePath, { encoding: "utf8" });
                    // Loop through languages
                    supportedLanguages.forEach(lang => {
                        if (!(0, fs_1.existsSync)(path.join(subtitlesFolder, lang)))
                            (0, fs_1.mkdirSync)(path.join(subtitlesFolder, lang));
                        const langStream = (0, fs_1.createWriteStream)(path.join(subtitlesFolder, lang, `${saveLocation.split(".")[0]}-${lang}.srt`), { flags: 'w' });
                        langStream.write(genSrtFromJSON(JSON.parse(jsonFile), lang));
                        langStream.close();
                    });
                }
            }
            // JSON Filename
            if (filesToCreate === "ALL" || filesToCreate === "JSON") {
                const jsonStream = (0, fs_1.createWriteStream)(jsonSavePath, { flags: 'w' });
                jsonStream.write(genSrtFromTranscribe(transcribe, { title: '', location: path.join(audioFolder, audioLoc) }).json);
                jsonStream.close();
            }
            console.log(`All done! File located @ \n - ${srtSavePath}`);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
exports.generateSubtitles = generateSubtitles;
function convertSubtitles(saveLocation, language) {
    return __awaiter(this, void 0, void 0, function* () {
        let file = (0, fs_1.readFileSync)(path.join(subtitlesFolder, saveLocation), { encoding: 'utf8' });
        let data = JSON.parse(file);
        for (const [i, val] of data.subtitles.entries()) {
            let res = yield fetch(`http://103-89-12-225.cloud-xip.com:5000/translate`, {
                method: 'POST',
                body: JSON.stringify({
                    q: val.utterance,
                    source: "en",
                    target: language,
                    format: "text",
                    api_key: ""
                }),
                headers: { "Content-Type": "application/json" }
            });
            let json = yield res.json();
            console.log(`Completed ${i + 1}/${data.length}`);
            if (!data[i]['languages'])
                data[i]['languages'] = {};
            data[i]['languages'][language] = json.translatedText;
        }
        return data;
    });
}
exports.convertSubtitles = convertSubtitles;
//# sourceMappingURL=mose.js.map