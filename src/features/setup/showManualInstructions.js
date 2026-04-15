import { colors } from '../cli/colors.js';

export function showManualInstructions(depName, platform) {
  console.log(`  ${colors.blue}📋${colors.reset} Instrucciones manuales para ${colors.bright}${depName}${colors.reset}:`);
  console.log();
  
  if (depName === 'yt-dlp') {
    switch (platform) {
      case 'macos':
        console.log(`     ${colors.dim}brew install yt-dlp${colors.reset}`);
        console.log(`     ${colors.dim}# o: pip3 install -U yt-dlp${colors.reset}`);
        break;
      case 'windows':
        console.log(`     ${colors.dim}winget install yt-dlp${colors.reset}`);
        console.log(`     ${colors.dim}# o: pip install -U yt-dlp${colors.reset}`);
        break;
      case 'linux':
        console.log(`     ${colors.dim}pip3 install -U yt-dlp${colors.reset}`);
        break;
    }
  } else if (depName === 'spotdl') {
    console.log(`     ${colors.dim}pip3 install -U spotdl${colors.reset}`);
    console.log(`     ${colors.dim}# o: pip install -U spotdl${colors.reset}`);
  } else if (depName === 'ffmpeg') {
    switch (platform) {
      case 'macos':
        console.log(`     ${colors.dim}brew install ffmpeg${colors.reset}`);
        break;
      case 'windows':
        console.log(`     ${colors.dim}winget install FFmpeg${colors.reset}`);
        console.log(`     ${colors.dim}# o descarga de: https://ffmpeg.org/download.html${colors.reset}`);
        break;
      case 'linux':
        console.log(`     ${colors.dim}sudo apt install ffmpeg${colors.reset}`);
        console.log(`     ${colors.dim}# o: sudo dnf install ffmpeg${colors.reset}`);
        break;
    }
  }
  console.log();
}
