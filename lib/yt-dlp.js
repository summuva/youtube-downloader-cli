import { spawn } from "child_process";

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
    if (!verbose && proc.stdout) {
      proc.stdout.on('data', () => {});
      proc.stderr.on('data', () => {});
    }
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp terminó con código ${code}`));
    });
  });
}
