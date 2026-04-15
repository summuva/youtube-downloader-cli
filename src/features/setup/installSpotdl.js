import { commandExists, runCommand } from '../../lib/platform.js';

export async function installSpotdl(platform) {
  if (commandExists('pip3')) {
    await runCommand('pip3', ['install', '-U', 'spotdl']);
  } else if (commandExists('pip')) {
    await runCommand('pip', ['install', '-U', 'spotdl']);
  } else {
    throw new Error('No se encontró pip. Instala Python primero.');
  }
}
