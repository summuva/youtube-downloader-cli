import os from 'os';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

export function parseArgs() {
  return yargs(hideBin(process.argv))
    .usage("Uso: $0 <url> [opciones]\n       $0 --setup")
    .demandCommand(1, "Debes proporcionar la URL de YouTube/Spotify (o usa --setup para configurar)")
    .option("setup", {
      alias: "S",
      describe: "Inicializar proyecto: verificar e instalar dependencias",
      type: "boolean",
    })
    .option("o", {
      alias: "output",
      describe: "Ruta o nombre del archivo de salida (sin extensión)",
      type: "string",
    })
    .option("a", {
      alias: "audio",
      describe: "Descargar solo audio y convertir a MP3 (YouTube)",
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
      describe: "Nombre de la carpeta donde guardar una playlist/album",
      type: "string",
    })
    .option("music-dir", {
      alias: "m",
      describe: "Directorio base donde guardar la música (se crea si no existe)",
      type: "string",
      default: path.join(os.homedir(), "Music", "ytcli-downloads"),
    })
    .option("verbose", {
      alias: "v",
      describe: "Mostrar salida detallada",
      type: "boolean",
      default: false,
    })
    .example('$0 "https://youtube.com/watch?v=xxx" -a', 'Descargar audio de YouTube')
    .example('$0 "https://open.spotify.com/track/xxx"', 'Descargar track de Spotify')
    .example('$0 "https://open.spotify.com/album/xxx"', 'Descargar álbum de Spotify')
    .example('$0 "https://open.spotify.com/playlist/xxx"', 'Descargar playlist de Spotify')
    .help().argv;
}
