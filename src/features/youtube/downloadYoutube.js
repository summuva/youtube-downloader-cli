import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ora from 'ora';
import { colors } from '../cli/colors.js';
import { clearLine } from '../cli/header.js';
import { formatDuration } from '../../lib/utils.js';
import { getSingleMediaOutputPath } from '../../lib/paths.js';

ffmpeg.setFfmpegPath(ffmpegStatic || 'ffmpeg');

export function downloadWithYtDlp(url, outputPath, isAudio, rawOutput = false, spinner = null, verbose = false) {
  return new Promise((resolve, reject) => {
    const args = ['--no-check-certificates', '--newline', '--no-warnings', '--progress'];

    if (!verbose) {
      args.push('--quiet');
    }

    if (isAudio) {
      args.push('-x', '--audio-format', 'mp3');
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }

    args.push('-o', outputPath, url);

    const proc = spawn('yt-dlp', args, {
      stdio: verbose ? 'inherit' : ['ignore', 'pipe', 'pipe']
    });

    let currentFile = '';
    let currentPercent = '0';
    let downloadCount = 0;
    let totalItems = 0;
    let lastPrintedSong = '';

    function updateDisplay() {
      if (!spinner) return;
      const countInfo = totalItems > 1 ? `(${downloadCount}/${totalItems}) ` : '';
      spinner.text = `Descargando ${countInfo}${currentPercent}%`;
    }

    function showCurrentSong(songName) {
      if (!songName || songName === lastPrintedSong) return;
      lastPrintedSong = songName;
      
      if (spinner) spinner.stop();
      
      const truncatedName = songName.length > 50 ? songName.substring(0, 47) + '...' : songName;
      console.log(`  ${colors.blue}🎵${colors.reset} ${colors.bright}${truncatedName}${colors.reset}`);
      
      if (spinner) spinner.start();
    }

    if (!verbose && proc.stdout) {
      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        
        for (const line of lines) {
          const playlistMatch = line.match(/Downloading item (\d+) of (\d+)/i);
          if (playlistMatch) {
            downloadCount = parseInt(playlistMatch[1]);
            totalItems = parseInt(playlistMatch[2]);
          }

          const progressMatch = line.match(/(\d+\.?\d*)%/);
          if (progressMatch) {
            currentPercent = Math.round(parseFloat(progressMatch[1])).toString();
            updateDisplay();
          }

          const destMatch = line.match(/Destination:\s*(.+)/);
          if (destMatch) {
            const fullPath = destMatch[1].trim();
            let fileName = path.basename(fullPath);
            fileName = fileName.replace(/\.[^.]+$/, '');
            fileName = fileName.replace(/^\d+\s*-\s*/, '');
            currentFile = fileName;
            downloadCount++;
            showCurrentSong(fileName);
          }

          const titleMatch = line.match(/\[download\]\s+Downloading video \d+ of \d+/);
          if (titleMatch) {
            updateDisplay();
          }
        }
      });

      proc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          const extractMatch = line.match(/\[youtube\]\s+\w+:\s+Downloading/);
          if (extractMatch) {
            updateDisplay();
          }
        }
      });
    }

    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp terminó con código ${code}`));
    });
  });
}

export async function downloadSingleVideoFlow(targetUrl, argv, musicDir, isAudio, verbose, handleFallback) {
  if (!ytdl.validateURL(targetUrl)) {
    console.log(`  ${colors.yellow}⚠${colors.reset}  URL inválida: ${colors.dim}${targetUrl}${colors.reset}`);
    console.log(`  ${colors.dim}  Formatos soportados:${colors.reset}`);
    console.log(`  ${colors.dim}  - YouTube: https://youtube.com/watch?v=...${colors.reset}`);
    console.log(`  ${colors.dim}  - Spotify: https://open.spotify.com/track/...${colors.reset}`);
    console.log();
    process.exit(1);
  }

  const spinner = ora({
    text: 'Obteniendo información del video...',
    prefixText: '  ',
    spinner: 'dots12',
  }).start();

  let info;
  try {
    info = await ytdl.getInfo(targetUrl);
  } catch (err) {
    spinner.text = 'Cambiando a yt-dlp...';
    if (!argv['no-fallback']) {
      await handleFallback(spinner, 'video', targetUrl);
      return;
    }
    spinner.fail('No se pudo obtener información del video');
    console.log();
    process.exit(1);
  }

  const rawTitle = info.videoDetails.title;
  const safeTitle = (argv.output || rawTitle).replace(/[\\/:*?"<>|]/g, '_');
  const duration = formatDuration(parseInt(info.videoDetails.lengthSeconds || 0));

  spinner.stop();
  clearLine();

  console.log(`  ${colors.cyan}▶${colors.reset} ${colors.bright}YouTube${colors.reset}`);
  console.log();
  console.log(`  ${colors.blue}🎬${colors.reset} ${colors.bright}${rawTitle}${colors.reset}`);
  console.log(`  ${colors.dim}   Duración: ${duration} │ Canal: ${info.videoDetails.author.name}${colors.reset}`);
  console.log();

  const dlSpinner = ora({
    text: isAudio ? 'Descargando audio...' : 'Descargando video...',
    prefixText: '  ',
    spinner: 'dots12',
  }).start();

  try {
    if (isAudio) {
      const audioStream = ytdl(targetUrl, { filter: 'audioonly', quality: 'highestaudio' });
      const outputPath = getSingleMediaOutputPath({
        baseDir: musicDir,
        folderArg: argv.folder,
        outputArg: argv.output,
        safeTitle,
        ext: 'mp3',
      });
      try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      } catch (e) {
        // ignore
      }

      let progress = 0;
      audioStream.on('progress', (_, downloaded, total) => {
        progress = Math.round((downloaded / total) * 100);
        dlSpinner.text = `Descargando audio... ${progress}%`;
      });

      await new Promise((resolve, reject) => {
        ffmpeg(audioStream)
          .audioBitrate(192)
          .format('mp3')
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(outputPath);
      });

      dlSpinner.succeed('Audio descargado');
      console.log();
      console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${safeTitle}.mp3${colors.reset}`);
      console.log(`  ${colors.dim}  ${outputPath}${colors.reset}`);
      console.log();
    } else {
      const videoStream = ytdl(targetUrl, { quality: argv.quality });
      const outputPath = getSingleMediaOutputPath({
        baseDir: musicDir,
        folderArg: argv.folder,
        outputArg: argv.output,
        safeTitle,
        ext: 'mp4',
      });
      try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      } catch (e) {
        // ignore
      }

      videoStream.on('progress', (_, downloaded, total) => {
        const progress = Math.round((downloaded / total) * 100);
        dlSpinner.text = `Descargando video... ${progress}%`;
      });

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        videoStream.pipe(file);
        file.on('finish', () => resolve());
        file.on('error', (err) => reject(err));
        videoStream.on('error', (err) => reject(err));
      });

      dlSpinner.succeed('Video descargado');
      console.log();
      console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${safeTitle}.mp4${colors.reset}`);
      console.log(`  ${colors.dim}  ${outputPath}${colors.reset}`);
      console.log();
    }
  } catch (err) {
    dlSpinner.text = 'Error, intentando método alternativo...';

    const msg = (err && (err.message || err.toString())) || '';
    const shouldFallback = !argv['no-fallback'] && (
      /decipher|could not parse|n transform|status code: 403|403|stream/i.test(msg)
    );

    if (shouldFallback) {
      await handleFallback(dlSpinner, safeTitle, targetUrl);
      return;
    }

    dlSpinner.fail('Error durante la descarga');
    if (verbose) console.error(`\n  ${err.message || err}`);
    console.log();
    process.exit(1);
  }
}
