# YouTube Downloader CLI

Pequeña herramienta de línea de comandos para descargar videos o extraer audio (MP3) desde YouTube.

## Resumen rápido

- Soporta descarga de un solo video o audio.
- Maneja playlists delegando a `yt-dlp` (fallback o obligatorio cuando corresponde).
- Usa `ytdl-core` para descargas de un solo video y `ffmpeg` (a través de `fluent-ffmpeg`) para convertir audio a MP3.
- Provee opciones para nombrado de salida, calidad, y directorios personalizados.

## Requisitos

- Node.js (>=14)
- npm o yarn
- `ffmpeg` (recomendado). El proyecto incluye `ffmpeg-static`, pero para mayor compatibilidad es recomendable instalar `ffmpeg` en el sistema.

En macOS con Homebrew:

```bash
brew install ffmpeg
```

## Instalación

Desde la carpeta del proyecto:

```bash
cd youtube-downloader-cli
npm install
# o
# yarn
```

Instalación global (opcional):

```bash
# dentro del repo
npm link
# ahora puedes usar `ytcli` desde cualquier directorio
```

## Uso

Sintaxis básica:

```bash
node index.js <URL> [opciones]
# o si instalaste globalmente
ytcli <URL> [opciones]
```

Opciones principales:

- `-o, --output <nombre>`: Ruta o nombre del archivo de salida (sin extensión). Si es relativa se guarda dentro del directorio configurado por `--music-dir`.
- `-a, --audio`: Descargar solo audio y convertir a MP3.
- `-q, --quality <nivel>`: Calidad de video para `ytdl-core`. Valores esperados: `lowest`, `low`, `medium`, `high`, `highest`. Por defecto: `highest`.
- `--no-fallback`: No intentar usar `yt-dlp` si falla la descarga con `ytdl-core`.
- `-d, --folder <nombre>`: Nombre de la carpeta donde guardar una playlist (cuando aplica).
- `-m, --music-dir, --music-dir <ruta>`: Directorio base donde guardar música/playlists. Por defecto en el proyecto: `/Users/jose/Documents/musica`.

Ejemplos:

- Descargar video (mejor calidad):

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID"
```

- Descargar solo audio y convertir a MP3:

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" -a
```

- Guardar con nombre específico:

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" -o "mi_cancion"
```

- Forzar que no haga fallback a `yt-dlp` (útil si quieres fallar rápido):

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" --no-fallback
```

## Playlists

Si pasas una URL de playlist, el script detecta la lista y usará `yt-dlp` para descargarla (porque `ytdl-core` no gestiona playlists). Puedes controlar el nombre de la carpeta con `-d/--folder` y el directorio base con `-m/--music-dir`.

El patrón de salida para playlists es: `<music-dir>/<folder>/%(playlist_index)s - %(title)s.%(ext)s`.

Si no quieres que el script use `yt-dlp` como fallback/gestor de playlists, pasa `--no-fallback` (en ese caso la descarga de playlists fallará intencionadamente).

## Comportamiento interno (contrato breve)

- Entrada: una URL de YouTube (video o playlist) y opciones CLI.
- Salida: un archivo `.mp4` (video) o `.mp3` (audio) guardado en el disco, o una carpeta con los archivos de una playlist.
- Errores: el proceso retorna exit code != 0 y escribe mensajes en stderr si falla (URL inválida, fallos de red, problemas con ffmpeg o yt-dlp).

## Dependencias importantes

- `@distube/ytdl-core` — descargas de vídeo/audio (single videos).
- `ffmpeg-static` y `fluent-ffmpeg` — conversión a MP3.
- `yargs` — parsing de opciones CLI.
- `yt-dlp` (instalación externa recomendada) — manejo de playlists y fallback cuando `ytdl-core` falla.

El proyecto define un `bin` llamado `ytcli` en `package.json`, por lo que después de `npm link` el comando estará disponible globalmente.

## Solución de problemas

- Si falla la extracción/decipher con `ytdl-core` (errores relacionados con tokens, 403, parsing), el script intentará usar `yt-dlp` como fallback (a menos que pases `--no-fallback`). Instala `yt-dlp` en tu sistema si planeas descargar playlists o usar fallback:

```bash
pip install -U yt-dlp
# o descargar el binario precompilado
```

- Si no encuentras `ffmpeg` o hay errores durante la conversión a MP3, instala `ffmpeg` en tu sistema (ver sección Requisitos).

## Ejemplo práctico rápido

```bash
# Descargar audio de una URL y guardarlo en el directorio por defecto
node index.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -a

# Descargar playlist (usará yt-dlp)
node index.js "https://www.youtube.com/playlist?list=YOUR_LIST_ID" -d "MiPlaylist"
```

## Contribuir

PRs y issues bienvenidos. Si vas a proponer cambios importantes, abre antes un issue para discutir el alcance.

## Licencia

Licencia ISC (igual que en `package.json`) y recuerda respetar las leyes y los términos de servicio al descargar contenidos.
# YouTube Downloader CLI

Pequeño CLI para descargar videos o audio desde YouTube.

Requisitos:
- Node.js (>=14)
- npm o yarn
- ffmpeg (recomendado) — el proyecto usa `ffmpeg-static` pero para mejores compatibilidades puedes instalar `ffmpeg` en tu sistema.

Instalación:

```bash
# desde la carpeta del proyecto
cd youtube-downloader-cli
npm install
# o con yarn
# yarn
```

Nota sobre ffmpeg:
- En macOS puedes instalar ffmpeg con Homebrew:

```bash
brew install ffmpeg
```

Uso:

- Descargar video (por defecto en la mejor calidad):

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID"
```

- Descargar solo audio y convertir a MP3:

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" -a
```

- Especificar nombre de salida (sin extensión):

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" -o "mi_nombre"
```

- Elegir calidad de video (lowest, low, medium, high, highest):

```bash
node index.js "https://www.youtube.com/watch?v=VIDEO_ID" -q high
```

Instalación global (opcional):

```bash
# desde la carpeta del proyecto
npm link
# ahora puedes usar el comando ytcli en cualquier lugar
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -a
```

Notas de seguridad y legales:
- Asegúrate de tener permiso para descargar y almacenar contenidos. Respeta los términos de servicio de YouTube.

Contribuciones bienvenidas.
