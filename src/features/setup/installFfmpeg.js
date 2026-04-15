import { commandExists, runCommand } from '../../lib/platform.js';

export async function installFfmpeg(platform) {
  switch (platform) {
    case 'macos':
      if (commandExists('brew')) {
        await runCommand('brew', ['install', 'ffmpeg']);
      } else {
        throw new Error('Homebrew no encontrado. Instala ffmpeg manualmente.');
      }
      break;
      
    case 'windows':
      if (commandExists('winget')) {
        await runCommand('winget', ['install', 'FFmpeg']);
      } else if (commandExists('scoop')) {
        await runCommand('scoop', ['install', 'ffmpeg']);
      } else if (commandExists('choco')) {
        await runCommand('choco', ['install', 'ffmpeg', '-y']);
      } else {
        throw new Error('No se encontró winget, scoop ni chocolatey.');
      }
      break;
      
    case 'linux':
      if (commandExists('apt')) {
        await runCommand('sudo', ['apt', 'install', '-y', 'ffmpeg']);
      } else if (commandExists('dnf')) {
        await runCommand('sudo', ['dnf', 'install', '-y', 'ffmpeg']);
      } else if (commandExists('pacman')) {
        await runCommand('sudo', ['pacman', '-S', '--noconfirm', 'ffmpeg']);
      } else {
        throw new Error('No se detectó gestor de paquetes compatible.');
      }
      break;
  }
}
