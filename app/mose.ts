
// File System
import { existsSync, mkdirSync, rmSync, readdirSync, createReadStream, createWriteStream, readFileSync } from "fs";
import * as path from "path";

//require the ffmpeg package so we can use ffmpeg using JS
const ffmpeg = require('fluent-ffmpeg');
//Get the paths to the packaged versions of the binaries we want to use
const ffmpegPath = require('ffmpeg-static').replace(
  'app.asar',
  'app.asar.unpacked'
);
const ffprobePath = require('ffprobe-static').path.replace(
  'app.asar',
  'app.asar.unpacked'
);
//tell the ffmpeg package where it can find the needed binaries.
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Platform Folders
import { getDocumentsFolder } from "platform-folders"

// Deep Gram
import { Deepgram } from "@deepgram/sdk";
import {Subtitle} from "../src/app/@interfaces/subtitle";

// Init items
let transcriber = new Deepgram("6b35dc4bce631821932e15d8aee5f113b01ceeae");

const fileInQuestion = path.join(getDocumentsFolder(), "@JWVT");
const videoFolder = path.join(fileInQuestion, "videos");
const audioFolder = path.join(fileInQuestion, "audio");
const subtitlesFolder = path.join(fileInQuestion, "subtitles")
const systemFolder = path.join(fileInQuestion, "SYSTEM")
const coreFolder = path.join(fileInQuestion, "SYSTEM", "core")

/**
 *
 * Check if folder has been created to save videos and srt files
 * if folder doesn't exist then we need to create the folder
 *
 * @return void
 *
 */

export function systemCheck(toPurge) {

  let itemsToCreate = [
    fileInQuestion,
    videoFolder,
    audioFolder,
    subtitlesFolder,
    systemFolder,
    coreFolder
  ]

  // Create System Files
  if(!existsSync(fileInQuestion) && !toPurge){
    itemsToCreate.forEach((folder) => mkdirSync(folder))
    setTimeout(() => console.log(`Required Folders Generated @ ${fileInQuestion}`)), 2500;
    return;
  }

  // Purge System Files
  if(existsSync(fileInQuestion) && toPurge) {
    rmSync(fileInQuestion, {recursive: true, force: true})
    setTimeout(() => console.log(`System Purged @ ${new Date()}`), 2500)
    return;
  }

  // Log if there is nothing to be completed
  console.log("No action taken, please try again...")
}

/**
 *
 * @param response
 * @param options
 *
 * Generates both a JSON File & SRT File
 *
 */
export function genSrtFromTranscribe(response, options = { title: '', location: ''}) {

  let string = "";
  let json = {
    title: options.title,
    location: options.location,
    created: new Date(),
    subtitles: []
  };

  for (let i = 0; i < response.results.utterances.length; i++) {
    const utterance = response.results.utterances[i]
    const start = new Date(utterance.start * 1000)
      .toISOString()
      .substr(11, 12)
      .replace('.', ',')
    const end = new Date(utterance.end * 1000)
      .toISOString()
      .substr(11, 12)
      .replace('.', ',')
    json.subtitles.push({id: (i + 1), sTime: utterance.start, eTime: utterance.end, sTimeFormatted: start, eTimeFormatted: end, utterance: utterance.transcript, languages: {}})
    string +=`${i + 1}\n${start} --> ${end}\n${utterance.transcript}\n\n`
  }

  return {
    text: string,
    json: JSON.stringify(json, null, 4)
  }

}

export function getSingleFile(mediaType, filename) {

  try {

    // Media Types :: Passes as properties
    if(mediaType.toUpperCase() === 'AUDIO') {
      let data = readFileSync(path.join(audioFolder, filename), {encoding: "utf8"});
      return data;
    }
    if(mediaType.toUpperCase() === 'SUBTITLE') {
      let data = readFileSync(path.join(subtitlesFolder, filename), {encoding: "utf8"});
      return data;
    }

  } catch(err) { return err; }

}

export function getFolderContent(folder) {

  if(folder.toUpperCase() === 'ROOT') return readdirSync(fileInQuestion);
  if(folder.toUpperCase() === 'AUDIO') return readdirSync(audioFolder);
  if(folder.toUpperCase() === 'VIDEO') return readdirSync(videoFolder);
  if(folder.toUpperCase() === 'SUBTITLE') return readdirSync(subtitlesFolder);

}

export function writeJsonSubtitleFile(json: Subtitle, fileName) {
  let writeFile = createWriteStream(path.join(subtitlesFolder, fileName), { flags: 'w' });
  writeFile.write(JSON.stringify(json, null, 4));
  writeFile.close();
  return true;
}

function genSrtFromJSON(json: Subtitle, language = 'en') {
  let string = "";

  if(language === 'en') {
    json.subtitles.forEach((subtitle, index) => {
      string +=`${index + 1}\n${subtitle.sTimeFormatted} --> ${subtitle.eTimeFormatted}\n${subtitle.utterance}\n\n`
    })
  } else {
    json.subtitles.forEach((subtitle, index) => {
      string +=`${index + 1}\n${subtitle.sTimeFormatted} --> ${subtitle.eTimeFormatted}\n${subtitle.languages[language]}\n\n`
    })
  }


  return string;
}

export async function generateSubtitles(saveLocation, filesToCreate = "") {

  if(filesToCreate === "") {filesToCreate = "ALL"}
  let supportedLanguages = ['en', 'es'];

  try {
    let transcribe;

    // Log what's going on
    console.log(`Working on creating subtitles for \n - ${saveLocation}`);

    let audioLoc = saveLocation.split(".")[0] + '.mp3';

    let source = {
      stream: createReadStream(path.join(audioFolder, audioLoc)),
      mimetype: 'audio/mp3'
    }


    if(filesToCreate === "ALL" || filesToCreate === "JSON") {
      transcribe = await transcriber.transcription
        .preRecorded(source, {
          times: false,
          punctuate: true,
          utterances: true,
          utt_split: 1,
          numbers: true,
          tier: "nova",
          keywords: ["Watchtower:2.2", "CAD:2.2"]
        })
    }

    if(!existsSync(path.join(subtitlesFolder, 'english'))) mkdirSync(path.join(subtitlesFolder, 'english'));


    let srtSavePath = path.join(subtitlesFolder, 'english', `${saveLocation.split(".")[0]}.srt`);
    let jsonSavePath = path.join(subtitlesFolder, `${saveLocation.split(".")[0]}.json`);

    // SRT Filename
    if(filesToCreate === "ALL" || filesToCreate === "SRT") {
      const srtStream = createWriteStream(srtSavePath, { flags: 'w' });

      if(filesToCreate === "ALL") {
        srtStream.write(genSrtFromTranscribe(transcribe, {title: '', location: path.join(audioFolder, audioLoc)}).text)
        srtStream.close()
      } else {

        // Read JSON FILE
        let jsonFile = readFileSync(jsonSavePath, {encoding: "utf8"});

        // Loop through languages
        supportedLanguages.forEach(lang => {
          if(!existsSync(path.join(subtitlesFolder, lang))) mkdirSync(path.join(subtitlesFolder, lang));
          const langStream = createWriteStream(path.join(subtitlesFolder, lang, `${saveLocation.split(".")[0]}-${lang}.srt`), { flags: 'w' });
          langStream.write(genSrtFromJSON(JSON.parse(jsonFile), lang))
          langStream.close();
        })
      }
    }

    // JSON Filename
    if(filesToCreate === "ALL" || filesToCreate === "JSON") {
      const jsonStream = createWriteStream(jsonSavePath, { flags: 'w' });
      jsonStream.write(genSrtFromTranscribe(transcribe, {title: '', location: path.join(audioFolder, audioLoc)}).json)
      jsonStream.close()
    }

    console.log(`All done! File located @ \n - ${srtSavePath}`);
    return true;

  } catch (err) {
    console.log(err)
    return false;
  }

}

export async function convertSubtitles(saveLocation, language) {

  let file = readFileSync(path.join(subtitlesFolder, saveLocation), {encoding: 'utf8'});
  let data = JSON.parse(file);

  for (const [i, val] of data.subtitles.entries()) {

    let res = await fetch(`http://103-89-12-225.cloud-xip.com:5000/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: val.utterance,
        source: "en",
        target: language,
        format: "text",
        api_key: ""
      }),
      headers: { "Content-Type": "application/json" }
    })

    let json = await res.json();
    console.log(`Completed ${i+1}/${data.length}`)

    if(!data[i]['languages']) data[i]['languages'] = {};
    data[i]['languages'][language] = json.translatedText;

  }
  return data;

}

