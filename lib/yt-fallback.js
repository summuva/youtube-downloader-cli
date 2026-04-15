import path from "path";
import { downloadWithYtDlp } from "./yt-dlp.js";
import { getSingleMediaOutputPath } from "./paths.js";

export async function handleFallback({
  spinner,
  safeTitle,
  url,
  isAudio,
  musicDir,
  folderArg,
  outputArg,
  ext,
  colors,
  verbose
}) {
  const outputPath = getSingleMediaOutputPath({
    baseDir: musicDir,
    folderArg,
    outputArg,
    safeTitle,
    ext
  });
  spinner.text = 'Descargando con yt-dlp...';
  try {
    await downloadWithYtDlp(url, outputPath, isAudio, false, spinner, verbose);
    spinner.succeed('Descarga completada');
    console.log();
    console.log(`  ${colors.green}✔${colors.reset} Guardado: ${colors.cyan}${path.basename(outputPath)}${colors.reset}`);
    console.log(`  ${colors.dim}  ${outputPath}${colors.reset}`);
    console.log();
    process.exit(0);
  } catch (e2) {
    spinner.fail('Falló la descarga alternativa');
    if (verbose) console.error(`\n  ${e2.message || e2}`);
    console.log();
    process.exit(1);
  }
}
