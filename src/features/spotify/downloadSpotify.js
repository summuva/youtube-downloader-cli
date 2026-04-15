import path from 'path';
import { spawn } from 'child_process';
import { colors } from '../cli/colors.js';

export function downloadWithSpotdl(url, outputDir, spinner = null) {
  return new Promise((resolve, reject) => {
    const args = [
      'download', url,
      '--output', path.join(outputDir, '{artist} - {title}'),
      '--format', 'mp3',
      '--bitrate', '320k'
    ];

    const proc = spawn('spotdl', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: outputDir
    });

    let currentSong = '';
    let lastPrintedSong = '';

    function showCurrentSong(songName) {
      if (!songName || songName === lastPrintedSong) return;
      lastPrintedSong = songName;
      
      if (spinner) spinner.stop();
      
      const truncatedName = songName.length > 50 ? songName.substring(0, 47) + '...' : songName;
      console.log(`  ${colors.magenta}🎵${colors.reset} ${colors.bright}${truncatedName}${colors.reset}`);
      
      if (spinner) spinner.start();
    }

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      
      for (const line of lines) {
        const downloadMatch = line.match(/Downloading\s+"?([^"]+)"?/i);
        if (downloadMatch) {
          currentSong = downloadMatch[1].trim();
          showCurrentSong(currentSong);
        }

        const progressMatch = line.match(/(\d+)%/);
        if (progressMatch && spinner) {
          spinner.text = `Descargando... ${progressMatch[1]}%`;
        }

        const doneMatch = line.match(/Downloaded\s+"?([^"]+)"?/i);
        if (doneMatch && spinner) {
          spinner.text = 'Procesando siguiente...';
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const line = data.toString();
      if (!/error/i.test(line)) return;
      if (spinner) spinner.text = `Error: ${line.substring(0, 50)}...`;
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('spotdl no está instalado. Ejecuta: ytcli --setup'));
      } else {
        reject(err);
      }
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`spotdl terminó con código ${code}`));
    });
  });
}
