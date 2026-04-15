import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { colors } from '../cli/colors.js';
import { showHeader } from '../cli/header.js';
import { detectOS, commandExists, runCommand } from '../../lib/platform.js';
import { installYtDlp } from './installYtDlp.js';
import { installSpotdl } from './installSpotdl.js';
import { installFfmpeg } from './installFfmpeg.js';
import { showManualInstructions } from './showManualInstructions.js';

export async function runSetup() {
  showHeader();
  console.log(`  ${colors.blue}🔧${colors.reset} ${colors.bright}Modo Setup${colors.reset}`);
  console.log(`  ${colors.dim}  Verificando e instalando dependencias...${colors.reset}`);
  console.log();

  const platform = detectOS();
  console.log(`  ${colors.cyan}📍${colors.reset} Sistema detectado: ${colors.bright}${platform}${colors.reset}`);
  console.log();

  const deps = [
    { name: 'yt-dlp', check: 'yt-dlp', for: 'YouTube' },
    { name: 'spotdl', check: 'spotdl', for: 'Spotify' },
    { name: 'ffmpeg', check: 'ffmpeg', for: 'Conversión de audio' },
  ];

  const missing = [];

  // Verificar dependencias
  for (const dep of deps) {
    const spinner = ora({ text: `Verificando ${dep.name}...`, prefixText: '  ' }).start();
    if (commandExists(dep.check)) {
      spinner.succeed(`${dep.name} está instalado ${colors.dim}(${dep.for})${colors.reset}`);
    } else {
      spinner.warn(`${dep.name} no encontrado ${colors.dim}(${dep.for})${colors.reset}`);
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
        } else if (dep.name === 'spotdl') {
          await installSpotdl(platform);
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
  
  const packageJsonPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../../..', 'package.json');
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
  console.log(`  ${colors.dim}────────────────────────────────────${colors.reset}`);
  console.log();

  // Verificación final
  const allOk = deps.every(dep => commandExists(dep.check));
  
  if (allOk) {
    console.log(`  ${colors.green}✔${colors.reset} ${colors.bright}Setup completado correctamente${colors.reset}`);
    console.log();
    console.log(`  ${colors.dim}Ahora puedes usar:${colors.reset}`);
    console.log();
    console.log(`  ${colors.cyan}YouTube:${colors.reset}`);
    console.log(`    ytcli <URL> -a        ${colors.dim}(descargar audio)${colors.reset}`);
    console.log(`    ytcli <URL>           ${colors.dim}(descargar video)${colors.reset}`);
    console.log();
    console.log(`  ${colors.magenta}Spotify:${colors.reset}`);
    console.log(`    ytcli <spotify-url>   ${colors.dim}(track, album o playlist)${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset}  Setup incompleto. Revisa las instrucciones manuales arriba.`);
  }
  
  console.log();
  process.exit(allOk ? 0 : 1);
}
