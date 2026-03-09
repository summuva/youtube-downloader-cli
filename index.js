#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import ytdl from "@distube/ytdl-core";
import { spawn, execSync } from 'child_process';
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ora from "ora";
import readline from "readline";

ffmpeg.setFfmpegPath(ffmpegStatic || 'ffmpeg');

// Colores ANSI para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Función para limpiar línea actual
function clearLine() {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

// Función para mostrar encabezado limpio
function showHeader() {
  console.log();
  console.log(`${colors.cyan}${colors.bright}  ♪ YouTube Downloader CLI${colors.reset}`);
  console.log(`${colors.dim}  ─────────────────────────${colors.reset}`);
  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP: Detecta SO e instala/verifica dependencias (yt-dlp, ffmpeg)
// ═══════════════════════════════════════════════════════════════════════════

function detectPlatform() {
  const platform = os.platform();
  if (platform === 'darwin') return 'macos';
  if (platform === 'win32') return 'windows';
  return 'linux';
}

function commandExists(cmd) {
  try {
    const checkCmd = detectPlatform() === 'windows' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...options });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Comando "${cmd}" terminó con código ${code}`));
    });
  });
}

async function runSetup() {
  showHeader();
  console.log(`  ${colors.blue}🔧${colors.reset} ${colors.bright}Modo Setup${colors.reset}`);
  console.log(`  ${colors.dim}  Verificando e instalando dependencias...${colors.reset}`);
  console.log();

  const platform = detectPlatform();
  console.log(`  ${colors.cyan}📍${colors.reset} Sistema detectado: ${colors.bright}${platform}${colors.reset}`);
  console.log();

  const deps = [
    { name: 'yt-dlp', check: 'yt-dlp' },
    { name: 'ffmpeg', check: 'ffmpeg' },
  ];

  const missing = [];
  const installed = [];

  // Verificar dependencias
  for (const dep of deps) {
    const spinner = ora({ text: `Verificando ${dep.name}...`, prefixText: '  ' }).start();
    if (commandExists(dep.check)) {
      spinner.succeed(`${dep.name} está instalado`);
      installed.push(dep.name);
    } else {
      spinner.warn(`${dep.name} no encontrado`);
      missing.push(dep);
    }
  }

  console.log();

  // Instalar dependencias faltantes
  if (missing.length > 0) {
    console.log(`  ${colors.yellow}📦${colors.reset} Instalando dependencias faltantes...`);
    console.log();

    for (const dep of missing) {
      const spinner = ora({ text: `Instalando ${dep.name}...`, prefixText: '  ' }).start();
      
      try {
        if (dep.name === 'yt-dlp') {
          await installYtDlp(platform);
        } else if (dep.name === 'ffmpeg') {
          await installFfmpeg(platform);
        }
        spinner.succeed(`${dep.name} instalado correctamente`);
      } catch (err) {
        spinner.fail(`Error instalando ${dep.name}`);
        console.log(`  ${colors.dim}  ${err.message}${colors.reset}`);
        console.log();
        showManualInstructions(dep.name, platform);
      }
    }
  }

  // Verificar dependencias de Node
  console.log();
  const nodeSpinner = ora({ text: 'Verificando dependencias de Node.js...', prefixText: '  ' }).start();
  
  const packageJsonPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'package.json');
  const nodeModulesPath = path.join(path.dirname(packageJsonPath), 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    nodeSpinner.succeed('Dependencias de Node.js instaladas');
  } else {
    nodeSpinner.text = 'Instalando dependencias de Node.js...';
    try {
      await runCommand('npm', ['install'], { cwd: path.dirname(packageJsonPath) });
      nodeSpinner.succeed('Dependencias de Node.js instaladas');
    } catch {
      nodeSpinner.fail('Error instalando dependencias de Node.js');
      console.log(`  ${colors.dim}  Ejecuta manualmente: npm install${colors.reset}`);
    }
  }

  // Resumen final
  console.log();
  console.log(`  ${colors.dim}─────────────────────────${colors.reset}`);
  console.log();

  // Verificación final
  const allOk = deps.every(dep => commandExists(dep.check));
  
  if (allOk) {
    console.log(`  ${colors.green}✔${colors.reset} ${colors.bright}Setup completado correctamente${colors.reset}`);
    console.log();
    console.log(`  ${colors.dim}Ahora puedes usar:${colors.reset}`);
    console.log(`  ${colors.cyan}ytcli <URL> -a${colors.reset}  ${colors.dim}(descargar audio)${colors.reset}`);
    console.log(`  ${colors.cyan}ytcli <URL>${colors.reset}     ${colors.dim}(descargar video)${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset}  Setup incompleto. Revisa las instrucciones manuales arriba.`);
  }
  
  console.log();
  process.exit(allOk ? 0 : 1);
}

async function installYtDlp(platform) {
  switch (platform) {
    case 'macos':
      // Intentar con brew, si no con pip
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
      // Intentar con winget, scoop, o pip
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
      // Intentar con pip
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

async function installFfmpeg(platform) {
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
      // Detectar gestor de paquetes
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

function showManualInstructions(depName, platform) {
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

// ═══════════════════════════════════════════════════════════════════════════

// Verificar si se pasa --setup antes de configurar yargs con demandCommand
const rawArgs = process.argv.slice(2);
const isSetupMode = rawArgs.includes('--setup') || rawArgs.includes('-S');

if (isSetupMode) {
  // Ejecutar setup y salir
  runSetup();
} else {
  // Flujo normal: parsear argumentos y ejecutar descarga

const argv = yargs(hideBin(process.argv))
  .usage("Uso: $0 <url> [opciones]\n       $0 --setup")
  .demandCommand(1, "Debes proporcionar la URL de YouTube (o usa --setup para configurar)")
  .option("setup", {
    alias: "S",
    describe: "Inicializar proyecto: verificar e instalar dependencias (yt-dlp, ffmpeg)",
    type: "boolean",
  })
  .option("o", {
    alias: "output",
    describe: "Ruta o nombre del archivo de salida (sin extensión)",
    type: "string",
  })
  .option("a", {
    alias: "audio",
    describe: "Descargar solo audio y convertir a MP3",
    type: "boolean",
  })
  .option("q", {
    alias: "quality",
    describe: "Calidad de video (lowest, low, medium, high, highest)",
    type: "string",
    default: "highest",
  })
  .option("no-fallback", {
    describe: "No usar yt-dlp como solución alternativa si falla ytdl",
    type: "boolean",
    default: false,
  })
  .option("folder", {
    alias: "d",
    describe: "Nombre de la carpeta donde guardar una playlist (si se descarga una)",
    type: "string",
  })
  .option("music-dir", {
    alias: "m",
    describe: "Directorio base donde guardar la música/playlists (se crea si no existe)",
    type: "string",
    default: path.join(os.homedir(), "Music", "ytcli-downloads"),
  })
  .option("verbose", {
    alias: "v",
    describe: "Mostrar salida detallada de yt-dlp",
    type: "boolean",
    default: false,
  })
  .help().argv;

const url = argv._[0];
const isAudio = argv.audio === true;
const quality = argv.quality;
const verbose = argv.verbose === true;

// Sanitize / normalize URL input to handle cases like shell-escaped characters
let targetUrl = String(url || '').trim();
targetUrl = targetUrl.replace(/\\+/g, '');
if (targetUrl.includes('music.youtube.com')) {
  targetUrl = targetUrl.replace('music.youtube.com', 'www.youtube.com');
}
try { targetUrl = decodeURIComponent(targetUrl); } catch (e) { /* ignore */ }
targetUrl = targetUrl.replace(/^<|>$/g, '');

const isPlaylist = /[?&]list=/.test(targetUrl) || /\/playlist\b/.test(targetUrl);

async function run() {
  showHeader();

  // Playlist flow
  if (isPlaylist) {
    if (argv['no-fallback']) {
      console.log(`  ${colors.yellow}⚠${colors.reset}  Playlist detectada pero --no-fallback activo.`);
      console.log(`     yt-dlp es necesario para playlists.\n`);
      process.exit(1);
    }

    const listMatch = targetUrl.match(/[?&]list=([^&]+)/);
    const listId = listMatch ? listMatch[1] : 'playlist';
    const rawBase = argv.folder ? argv.folder : (argv.output || `playlist_${listId}`);
    const baseName = String(rawBase).replace(/[\\/:*?"<>|]/g, "_");
    const musicDir = argv['music-dir'];
    const outDir = path.resolve(musicDir, baseName);
    try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) { /* ignore */ }

    const outPattern = path.join(outDir, '%(playlist_index)s - %(title)s.%(ext)s');

    console.log(`  ${colors.blue}📁${colors.reset} Carpeta: ${colors.dim}${outDir}${colors.reset}`);
    console.log(`  ${colors.blue}🎵${colors.reset} Formato: ${isAudio ? 'MP3 (audio)' : 'Video'}`);
    console.log();

    const spinner = ora({
      text: 'Obteniendo información de la playlist...',
      prefixText: '  ',
      spinner: 'dots12',
    }).start();

    try {
      await downloadWithYtDlp(targetUrl, outPattern, isAudio, true, spinner);
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

  // Single video flow
  if (!ytdl.validateURL(targetUrl)) {
    console.log(`  ${colors.yellow}⚠${colors.reset}  URL inválida: ${colors.dim}${url}${colors.reset}\n`);
    process.exit(1);
  }

  const spinner = ora({
    text: 'Obteniendo información del video...',
    prefixText: '  ',
    spinner: 'dots12',
  }).start();

  let info;
  try {
    info = await ytdl.getInfo(targetUrl);
  } catch (err) {
    spinner.text = 'Cambiando a yt-dlp...';
    // Fallback directo a yt-dlp si falla getInfo
    if (!argv['no-fallback']) {
      await handleFallback(spinner, 'video', targetUrl);
      return;
    }
    spinner.fail('No se pudo obtener información del video');
    console.log();
    process.exit(1);
  }

  const rawTitle = info.videoDetails.title;
  const safeTitle = (argv.output || rawTitle).replace(/[\\/:*?"<>|]/g, "_");
  const musicDir = argv['music-dir'];
  const duration = formatDuration(parseInt(info.videoDetails.lengthSeconds || 0));

  spinner.stop();
  clearLine();

  // Mostrar info del video
  console.log(`  ${colors.blue}🎬${colors.reset} ${colors.bright}${rawTitle}${colors.reset}`);
  console.log(`  ${colors.dim}   Duración: ${duration} │ Canal: ${info.videoDetails.author.name}${colors.reset}`);
  console.log();

  const dlSpinner = ora({
    text: isAudio ? 'Descargando audio...' : 'Descargando video...',
    prefixText: '  ',
    spinner: 'dots12',
  }).start();

  try {
    if (isAudio) {
      const audioStream = ytdl(targetUrl, { filter: 'audioonly', quality: 'highestaudio' });

      let outName = argv.output ? String(argv.output) : `${safeTitle}`;
      let outputPath = path.isAbsolute(outName)
        ? path.resolve(outName + '.mp3')
        : path.resolve(musicDir, outName + '.mp3');
      try { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); } catch (e) { /* ignore */ }

      let progress = 0;
      audioStream.on('progress', (_, downloaded, total) => {
        progress = Math.round((downloaded / total) * 100);
        dlSpinner.text = `Descargando audio... ${progress}%`;
      });

      await new Promise((resolve, reject) => {
        ffmpeg(audioStream)
          .audioBitrate(192)
          .format('mp3')
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(outputPath);
      });

      dlSpinner.succeed('Audio descargado');
      console.log();
      console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${safeTitle}.mp3${colors.reset}`);
      console.log(`  ${colors.dim}  ${outputPath}${colors.reset}`);
      console.log();
    } else {
      const videoStream = ytdl(targetUrl, { quality: quality });
      let outName = argv.output ? String(argv.output) : `${safeTitle}`;
      let outputPath = path.isAbsolute(outName)
        ? path.resolve(outName + '.mp4')
        : path.resolve(musicDir, outName + '.mp4');
      try { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); } catch (e) { /* ignore */ }

      videoStream.on('progress', (_, downloaded, total) => {
        const progress = Math.round((downloaded / total) * 100);
        dlSpinner.text = `Descargando video... ${progress}%`;
      });

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        videoStream.pipe(file);
        file.on('finish', () => resolve());
        file.on('error', (err) => reject(err));
        videoStream.on('error', (err) => reject(err));
      });

      dlSpinner.succeed('Video descargado');
      console.log();
      console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${safeTitle}.mp4${colors.reset}`);
      console.log(`  ${colors.dim}  ${outputPath}${colors.reset}`);
      console.log();
    }
  } catch (err) {
    dlSpinner.text = 'Error, intentando método alternativo...';

    const msg = (err && (err.message || err.toString())) || '';
    const shouldFallback = !argv['no-fallback'] && (
      /decipher|could not parse|n transform|status code: 403|403|stream/i.test(msg)
    );

    if (shouldFallback) {
      await handleFallback(dlSpinner, safeTitle, targetUrl);
      return;
    }

    dlSpinner.fail('Error durante la descarga');
    if (verbose) console.error(`\n  ${err.message || err}`);
    console.log();
    process.exit(1);
  }
}

async function handleFallback(spinner, safeTitle, url) {
  const musicDir = argv['music-dir'];
  const outPath = isAudio ? `${safeTitle}.mp3` : `${safeTitle}.mp4`;
  const resolvedOutPath = path.isAbsolute(outPath)
    ? path.resolve(outPath)
    : path.resolve(musicDir, outPath);

  spinner.text = 'Descargando con yt-dlp...';

  try {
    await downloadWithYtDlp(url, resolvedOutPath, isAudio, false, spinner);
    spinner.succeed('Descarga completada');
    console.log();
    console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${path.basename(resolvedOutPath)}${colors.reset}`);
    console.log(`  ${colors.dim}  ${resolvedOutPath}${colors.reset}`);
    console.log();
    process.exit(0);
  } catch (e2) {
    spinner.fail('Falló la descarga alternativa');
    if (verbose) console.error(`\n  ${e2.message || e2}`);
    console.log();
    process.exit(1);
  }
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * downloadWithYtDlp - Descarga usando yt-dlp con salida limpia
 * Muestra el nombre de la canción actual y el progreso en tiempo real
 */
function downloadWithYtDlp(url, outputPath, isAudio, rawOutput = false, spinner = null) {
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

    let currentFile = '';
    let currentPercent = '0';
    let downloadCount = 0;
    let totalItems = 0;
    let lastPrintedSong = '';

    // Función para actualizar la visualización
    function updateDisplay() {
      if (!spinner) return;
      
      const countInfo = totalItems > 1 ? `(${downloadCount}/${totalItems}) ` : '';
      spinner.text = `Descargando ${countInfo}${currentPercent}%`;
    }

    // Función para mostrar el nombre de la canción actual
    function showCurrentSong(songName) {
      if (!songName || songName === lastPrintedSong) return;
      lastPrintedSong = songName;
      
      // Pausar spinner, imprimir nombre, reanudar
      if (spinner) spinner.stop();
      
      // Limpiar y mostrar nombre de canción con ícono
      const truncatedName = songName.length > 50 ? songName.substring(0, 47) + '...' : songName;
      console.log(`  ${colors.blue}🎵${colors.reset} ${colors.bright}${truncatedName}${colors.reset}`);
      
      if (spinner) spinner.start();
    }

    if (!verbose && proc.stdout) {
      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        
        for (const line of lines) {
          // Detectar total de items en playlist
          const playlistMatch = line.match(/Downloading item (\d+) of (\d+)/i);
          if (playlistMatch) {
            downloadCount = parseInt(playlistMatch[1]);
            totalItems = parseInt(playlistMatch[2]);
          }

          // Detectar progreso de descarga (ej: "50.5%" o "[download]  45.2%")
          const progressMatch = line.match(/(\d+\.?\d*)%/);
          if (progressMatch) {
            currentPercent = Math.round(parseFloat(progressMatch[1])).toString();
            updateDisplay();
          }

          // Detectar nombre del archivo actual desde Destination
          const destMatch = line.match(/Destination:\s*(.+)/);
          if (destMatch) {
            const fullPath = destMatch[1].trim();
            let fileName = path.basename(fullPath);
            // Quitar extensión y número de índice si existe (ej: "01 - Song Name.mp3")
            fileName = fileName.replace(/\.[^.]+$/, ''); // quitar extensión
            fileName = fileName.replace(/^\d+\s*-\s*/, ''); // quitar índice de playlist
            currentFile = fileName;
            downloadCount++;
            showCurrentSong(fileName);
          }

          // Detectar título desde [download] Downloading video X of Y
          const titleMatch = line.match(/\[download\]\s+Downloading video \d+ of \d+/);
          if (titleMatch) {
            updateDisplay();
          }
        }
      });

      // Capturar stderr para más info
      proc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          // Extraer título del video desde líneas de extracción
          const extractMatch = line.match(/\[youtube\]\s+\w+:\s+Downloading/);
          if (extractMatch) {
            updateDisplay();
          }
        }
      });
    }

    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp terminó con código ${code}`));
    });
  });
}

run();

} // Cierre del bloque else (flujo normal, no setup)