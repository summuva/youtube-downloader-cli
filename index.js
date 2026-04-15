#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ora from 'ora';

// CLI imports
import { colors } from './src/features/cli/colors.js';
import { showHeader, clearLine } from './src/features/cli/header.js';
import { parseArgs } from './src/features/cli/args.js';
import { normalizeYoutubeUrl, isPlaylistUrl } from './src/features/cli/utils.js';

// Platform and utils imports
import { sanitizeUrl, sanitizePath } from './src/lib/utils.js';
import { commandExists, detectOS } from './src/lib/platform.js';
import { getSingleMediaOutputPath } from './src/lib/paths.js';

// Setup imports
import { runSetup } from './src/features/setup/setup.js';

// Spotify imports
import { detectPlatform, getSpotifyType } from './src/features/spotify/spotifyHelpers.js';
import { downloadWithSpotdl } from './src/features/spotify/downloadSpotify.js';

// YouTube imports
import { downloadSingleVideoFlow, downloadWithYtDlp } from './src/features/youtube/downloadYoutube.js';
import { downloadPlaylistFlow } from './src/features/youtube/downloadPlaylist.js';

// Check for setup mode before parsing args
const rawArgs = process.argv.slice(2);
const isSetupMode = rawArgs.includes('--setup') || rawArgs.includes('-S');

if (isSetupMode) {
  // Ejecutar setup y salir
  runSetup();
} else {
  // Flujo normal: parsear argumentos y ejecutar descarga
  const argv = parseArgs();

  const url = argv._[0];
  const isAudio = argv.audio === true;
  const musicDir = argv['music-dir'];
  const verbose = argv.verbose === true;

  // Sanitize URL
  let targetUrl = sanitizeUrl(url);

  // Detectar plataforma
  const platform = detectPlatform(targetUrl);

  async function run() {
    showHeader();

    // ═══════════════════════════════════════════════════════════════════════════
    // SPOTIFY FLOW
    // ═══════════════════════════════════════════════════════════════════════════
    if (platform === 'spotify') {
      const spotifyType = getSpotifyType(targetUrl);
      const typeNames = { track: 'canción', album: 'álbum', playlist: 'playlist', artist: 'artista' };
      
      console.log(`  ${colors.magenta}🎧${colors.reset} ${colors.bright}Spotify${colors.reset} - ${typeNames[spotifyType] || 'contenido'}`);
      console.log(`  ${colors.dim}  ${targetUrl.substring(0, 60)}...${colors.reset}`);
      console.log();

      // Verificar que spotdl está instalado
      if (!commandExists('spotdl')) {
        console.log(`  ${colors.yellow}⚠${colors.reset}  spotdl no está instalado.`);
        console.log(`  ${colors.dim}  Ejecuta: ${colors.cyan}ytcli --setup${colors.reset}`);
        console.log();
        process.exit(1);
      }

      // Preparar directorio de salida
      let outDir = musicDir;
      if (argv.folder) {
        outDir = path.resolve(musicDir, sanitizePath(String(argv.folder)));
      } else if (spotifyType === 'album' || spotifyType === 'playlist') {
        outDir = path.resolve(musicDir, `spotify_${spotifyType}_${Date.now()}`);
      }
      
      try {
        fs.mkdirSync(outDir, { recursive: true });
      } catch (e) {
        // ignore
      }

      console.log(`  ${colors.blue}📁${colors.reset} Carpeta: ${colors.dim}${outDir}${colors.reset}`);
      console.log(`  ${colors.blue}🎵${colors.reset} Formato: ${colors.dim}MP3 320kbps${colors.reset}`);
      console.log();

      const spinner = ora({
        text: 'Conectando con Spotify...',
        prefixText: '  ',
        spinner: 'dots12',
      }).start();

      try {
        await downloadWithSpotdl(targetUrl, outDir, spinner);
        spinner.succeed('Descarga completada');
        console.log();
        console.log(`  ${colors.green}✔${colors.reset} Guardado en: ${colors.cyan}${outDir}${colors.reset}`);
        console.log();
        process.exit(0);
      } catch (e) {
        spinner.fail('Error en la descarga');
        if (verbose) console.error(`\n  ${e.message || e}`);
        console.log();
        process.exit(1);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // YOUTUBE FLOW
    // ═══════════════════════════════════════════════════════════════════════════
    targetUrl = normalizeYoutubeUrl(targetUrl);
    const isPlaylist = isPlaylistUrl(targetUrl);

    // Crear handleFallback con contexto adecuado
    const handleFallback = async (spinner, safeTitle, url) => {
      const ext = isAudio ? 'mp3' : 'mp4';
      const outputPath = getSingleMediaOutputPath({
        baseDir: musicDir,
        folderArg: argv.folder,
        outputArg: argv.output,
        safeTitle,
        ext
      });
      spinner.text = 'Descargando con yt-dlp...';
      try {
        await downloadWithYtDlp(url, outputPath, isAudio, false, spinner, verbose);
        spinner.succeed('Descarga completada');
        console.log();
        console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${path.basename(outputPath)}${colors.reset}`);
        console.log(`  ${colors.dim}  ${outputPath}${colors.reset}`);
        console.log();
        process.exit(0);
      } catch (e2) {
        spinner.fail('Falló la descarga alternativa');
        if (verbose) console.error(`\n  ${e2.message || e2}`);
        console.log();
        process.exit(1);
      }
    };

    // Playlist flow
    if (isPlaylist) {
      if (argv['no-fallback']) {
        console.log(`  ${colors.yellow}⚠${colors.reset}  Playlist detectada pero --no-fallback activo.`);
        console.log(`     yt-dlp es necesario para playlists.\n`);
        process.exit(1);
      }
      await downloadPlaylistFlow(targetUrl, argv, musicDir, isAudio, verbose);
      return;
    }

    // Single video flow
    await downloadSingleVideoFlow(targetUrl, argv, musicDir, isAudio, verbose, handleFallback);
  }

  run();
}
