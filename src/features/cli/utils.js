import { sanitizeUrl } from '../../lib/utils.js';
import { getSingleMediaOutputPath } from '../../lib/paths.js';

export function normalizeYoutubeUrl(url) {
  if (url.includes('music.youtube.com')) {
    return url.replace('music.youtube.com', 'www.youtube.com');
  }
  return url;
}

export function isPlaylistUrl(url) {
  return /[?&]list=/.test(url) || /\/playlist\b/.test(url);
}

export function handleFallbackFactory(argv, musicDir, isAudio) {
  return async function handleFallback(spinner, safeTitle, url, verbose, downloadWithYtDlp) {
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
      const path = require('path');
      console.log(`  \x1b[32m✔\x1b[0m Guardado: \x1b[36m${path.basename(outputPath)}\x1b[0m`);
      console.log(`  \x1b[2m  ${outputPath}\x1b[0m`);
      console.log();
      process.exit(0);
    } catch (e2) {
      spinner.fail('Falló la descarga alternativa');
      if (verbose) console.error(`\n  ${e2.message || e2}`);
      console.log();
      process.exit(1);
    }
  };
}
