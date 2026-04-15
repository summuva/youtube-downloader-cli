import { commandExists, runCommand } from '../../lib/platform.js';

export async function installYtDlp(platform) {
  switch (platform) {
    case 'macos':
      if (commandExists('brew')) {
        await runCommand('brew', ['install', 'yt-dlp']);
      } else if (commandExists('pip3')) {
        await runCommand('pip3', ['install', '-U', 'yt-dlp']);
      } else if (commandExists('pip')) {
        await runCommand('pip', ['install', '-U', 'yt-dlp']);
      } else {
        throw new Error('No se encontró brew ni pip. Instala manualmente.');
      }
      break;
      
    case 'windows':
      if (commandExists('winget')) {
        await runCommand('winget', ['install', 'yt-dlp']);
      } else if (commandExists('scoop')) {
        await runCommand('scoop', ['install', 'yt-dlp']);
      } else if (commandExists('pip')) {
        await runCommand('pip', ['install', '-U', 'yt-dlp']);
      } else {
        throw new Error('No se encontró winget, scoop ni pip.');
      }
      break;
      
    case 'linux':
      if (commandExists('pip3')) {
        await runCommand('pip3', ['install', '-U', 'yt-dlp']);
      } else if (commandExists('pip')) {
        await runCommand('pip', ['install', '-U', 'yt-dlp']);
      } else {
        throw new Error('No se encontró pip. Instala python3-pip.');
      }
      break;
  }
}
