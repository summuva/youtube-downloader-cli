#!/usr/bin/env node
import fs from "fs";
import path from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import ytdl from "@distube/ytdl-core";
import { spawn } from 'child_process';
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ora from "ora";

ffmpeg.setFfmpegPath(ffmpegStatic || 'ffmpeg');

const argv = yargs(hideBin(process.argv))
  .usage("Uso: $0 <url> [opciones]")
  .demandCommand(1, "Debes proporcionar la URL de YouTube")
  .option("o", {
    alias: "output",
    describe: "Ruta o nombre del archivo de salida (sin extensión)",
    type: "string",
  })
  .option("a", {
    alias: "audio",
    describe: "Descargar solo audio y convertir a MP3",
    type: "boolean",
  })
  .option("q", {
    alias: "quality",
    describe: "Calidad de video (lowest, low, medium, high, highest)",
    type: "string",
    default: "highest",
  })
  .option("no-fallback", {
    describe: "No usar yt-dlp como solución alternativa si falla ytdl",
    type: "boolean",
    default: false,
  })
  .option("folder", {
    alias: "d",
    describe: "Nombre de la carpeta donde guardar una playlist (si se descarga una)",
    type: "string",
  })
  .option("music-dir", {
    alias: "m",
    describe: "Directorio base donde guardar la música/playlists (se crea si no existe)",
    type: "string",
    default: "/Users/jose/Documents/musica",
  })
  .help().argv;

const url = argv._[0];
const isAudio = argv.audio === true;
const quality = argv.quality;

// Sanitize / normalize URL input to handle cases like shell-escaped characters
let targetUrl = String(url || '').trim();
// Remove literal backslashes that users may have added when escaping in the shell
targetUrl = targetUrl.replace(/\\+/g, '');
// Normalize music.youtube.com -> www.youtube.com
if (targetUrl.includes('music.youtube.com')) {
  targetUrl = targetUrl.replace('music.youtube.com', 'www.youtube.com');
}
// Decode percent-encoded input if any
try { targetUrl = decodeURIComponent(targetUrl); } catch (e) { /* ignore */ }
// Strip surrounding angle brackets if present
targetUrl = targetUrl.replace(/^<|>$/g, '');

// Detect playlist URLs (e.g. ?list=...)
const isPlaylist = /[?&]list=/.test(targetUrl) || /\/playlist\b/.test(targetUrl);

async function run() {
  // If it's a playlist, use yt-dlp to handle it (ytdl-core doesn't manage playlists)
  if (isPlaylist) {
    if (argv['no-fallback']) {
      console.error("❌ Playlist detectada. yt-dlp es necesario para descargar playlists. Ejecuta sin --no-fallback para permitir fallback.");
      process.exit(1);
    }

  // Derivar nombre base para carpeta de salida (permitir --folder/-d)
  const listMatch = targetUrl.match(/[?&]list=([^&]+)/);
  const listId = listMatch ? listMatch[1] : 'playlist';
  const rawBase = argv.folder ? argv.folder : (argv.output || `playlist_${listId}`);
  const baseName = String(rawBase).replace(/[\\/:*?"<>|]/g, "_");
  // Usar musicDir como raíz para guardar playlists
  const musicDir = argv['music-dir'];
  const outDir = path.resolve(musicDir, baseName);
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) { /* ignore */ }

    // Patrón de salida para yt-dlp: índice + título + extensión
    const outPattern = path.join(outDir, '%(playlist_index)s - %(title)s.%(ext)s');

    const spinner = ora('Descargando playlist con yt-dlp...').start();
    try {
      spinner.stop();
      await downloadWithYtDlp(targetUrl, outPattern, isAudio, true);
      console.log(`✅ Playlist descargada en: ${outDir}`);
      process.exit(0);
    } catch (e) {
      spinner.fail('❌ Falló la descarga de la playlist con yt-dlp');
      console.error(e.message || e);
      process.exit(1);
    }
  }

  // Single video flow
  if (!ytdl.validateURL(targetUrl)) {
    console.error("❌ URL inválida. Pasa una URL válida de YouTube. (se recibió: "+url+")");
    process.exit(1);
  }

  const info = await ytdl.getInfo(targetUrl);
  const rawTitle = info.videoDetails.title;
  const safeTitle = (argv.output || rawTitle).replace(/[\\/:*?"<>|]/g, "_");
  const musicDir = argv['music-dir'];

  const spinner = ora('Preparando descarga...').start();

  try {
    if (isAudio) {
      spinner.text = 'Descargando audio y convirtiendo a MP3...';

      const audioStream = ytdl(targetUrl, { filter: 'audioonly', quality: 'highestaudio' });

      // Si argv.output es un path absoluto, respetarlo; si es relativo o no existe, guardarlo dentro de musicDir
      let outName = argv.output ? String(argv.output) : `${safeTitle}`;
      let outputPath = path.isAbsolute(outName)
        ? path.resolve(outName + '.mp3')
        : path.resolve(musicDir, outName + '.mp3');
      // Asegurar carpeta existe
      try { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); } catch (e) { /* ignore */ }

      await new Promise((resolve, reject) => {
        ffmpeg(audioStream)
          .audioBitrate(192)
          .format('mp3')
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(outputPath);
      });

      spinner.succeed(`✅ Audio guardado en: ${safeTitle}.mp3`);
    } else {
      spinner.text = 'Descargando video...';

      const videoStream = ytdl(targetUrl, { quality: quality });
      let outName = argv.output ? String(argv.output) : `${safeTitle}`;
      let outputPath = path.isAbsolute(outName)
        ? path.resolve(outName + '.mp4')
        : path.resolve(musicDir, outName + '.mp4');
      try { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); } catch (e) { /* ignore */ }

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        videoStream.pipe(file);
        file.on('finish', () => resolve());
        file.on('error', (err) => reject(err));
        videoStream.on('error', (err) => reject(err));
      });

      spinner.succeed(`✅ Video guardado en: ${safeTitle}.mp4`);
    }
  } catch (err) {
    spinner.fail('❌ Error durante la descarga');
    console.error(err.message || err);

    // Fallback a yt-dlp si la falla parece venir de parsing/decipher o 403
    const msg = (err && (err.message || err.toString())) || '';
    const shouldFallback = !argv['no-fallback'] && (
      /decipher|could not parse|n transform|status code: 403|403/.test(msg.toLowerCase())
    );

    if (shouldFallback) {
      console.log('➡️  Intentando fallback con yt-dlp...');
      spinner.stop();
      const outPath = isAudio ? `${safeTitle}.mp3` : `${safeTitle}.mp4`;
      // Resolver salida dentro de musicDir (mantener comportamiento si se pasa ruta absoluta en -o)
      const resolvedOutPath = path.isAbsolute(outPath)
        ? path.resolve(outPath)
        : path.resolve(musicDir, outPath);
      try {
        await downloadWithYtDlp(targetUrl, resolvedOutPath, isAudio);
        console.log(`✅ Descargado con yt-dlp: ${resolvedOutPath}`);
        process.exit(0);
      } catch (e2) {
        console.error('❌ Fallback con yt-dlp falló:', e2.message || e2);
        process.exit(1);
      }
    }

    process.exit(1);
  }
}

/**
 * downloadWithYtDlp(url, outputPath, isAudio, rawOutput)
 * - outputPath: si rawOutput === true, se pasa tal cual a -o (puede contener patrones de yt-dlp)
 * - si rawOutput === false, outputPath es una ruta final (archivo) donde yt-dlp guardará el resultado
 */
function downloadWithYtDlp(url, outputPath, isAudio, rawOutput = false) {
  return new Promise((resolve, reject) => {
    const args = [];
    
    // Evitar errores de certificados SSL en yt-dlp (común en macOS)
    args.push('--no-check-certificates');

    if (isAudio) {
      // Extraer audio y convertir a mp3
      args.push('-x', '--audio-format', 'mp3');
    } else {
      // Mejor calidad de video+audio
      args.push('-f', 'bestvideo+bestaudio/best');
    }
    // Añadir opciones comunes
    // Si se pasa outputPath crudo (patrón), usar tal cual; si no, usar la ruta final
    args.push('-o', outputPath, url);

    const proc = spawn('yt-dlp', args, { stdio: 'inherit' });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve(); else reject(new Error('yt-dlp exit ' + code));
    });
  });
}

run();