import readline from 'readline';
import { colors } from './colors.js';

export function clearLine() {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

export function showHeader() {
  console.log();
  console.log(`${colors.cyan}${colors.bright}  ♪ YouTube & Spotify Downloader CLI${colors.reset}`);
  console.log(`${colors.dim}  ────────────────────────────────────${colors.reset}`);
  console.log();
}
