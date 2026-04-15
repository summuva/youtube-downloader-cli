import path from 'path';
import fs from 'fs';
import ora from 'ora';
import { colors } from '../cli/colors.js';
import { downloadWithYtDlp } from './downloadYoutube.js';

export async function downloadPlaylistFlow(targetUrl, argv, musicDir, isAudio, verbose) {
  const listMatch = targetUrl.match(/[?&]list=([^&]+)/);
  const listId = listMatch ? listMatch[1] : 'playlist';
  const rawBase = argv.folder ? argv.folder : (argv.output || `playlist_${listId}`);
  const baseName = String(rawBase).replace(/[\\/:*?"<>|]/g, '_');
  const outDir = path.resolve(musicDir, baseName);
  
  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch (e) {
    // ignore
  }

  const outPattern = path.join(outDir, '%(playlist_index)s - %(title)s.%(ext)s');

  console.log(`  ${colors.cyan}▶${colors.reset} ${colors.bright}YouTube Playlist${colors.reset}`);
  console.log();
  console.log(`  ${colors.blue}📁${colors.reset} Carpeta: ${colors.dim}${outDir}${colors.reset}`);
  console.log(`  ${colors.blue}🎵${colors.reset} Formato: ${isAudio ? 'MP3 (audio)' : 'Video'}`);
  console.log();

  const spinner = ora({
    text: 'Obteniendo información de la playlist...',
    prefixText: '  ',
    spinner: 'dots12',
  }).start();

  try {
    await downloadWithYtDlp(targetUrl, outPattern, isAudio, true, spinner, verbose);
    spinner.succeed('Playlist descargada correctamente');
    console.log();
    console.log(`  ${colors.green}✔${colors.reset} Guardado en: ${colors.cyan}${outDir}${colors.reset}`);
    console.log();
    process.exit(0);
  } catch (e) {
    spinner.fail('Error al descargar la playlist');
    if (verbose) console.error(`\n  ${e.message || e}`);
    console.log();
    process.exit(1);
  }
}
