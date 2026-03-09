# YouTube Downloader CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Herramienta de línea de comandos para descargar videos y audio desde YouTube.

## ⚡ Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/summuva/youtube-downloader-cli.git
cd youtube-downloader-cli

# 2. Instalar dependencias de Node
npm install

# 3. Ejecutar setup (instala yt-dlp y ffmpeg automáticamente)
node index.js --setup

# 4. (Opcional) Instalar globalmente
npm link

# 5. ¡Listo! Descargar audio
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -a
```

## 📦 Requisitos

- **Node.js** >= 16
- **yt-dlp** (se instala automáticamente con `--setup`)
- **ffmpeg** (se instala automáticamente con `--setup`)

## 🔧 Instalación manual de dependencias

Si el setup automático falla, instala manualmente:

### macOS
```bash
brew install yt-dlp ffmpeg
```

### Windows
```bash
winget install yt-dlp FFmpeg
# o con scoop:
scoop install yt-dlp ffmpeg
```

### Linux (Debian/Ubuntu)
```bash
pip3 install -U yt-dlp
sudo apt install ffmpeg
```

## 🎵 Uso

### Descargar audio (MP3)
```bash
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -a
```

### Descargar video
```bash
ytcli "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Descargar playlist completa
```bash
ytcli "https://www.youtube.com/playlist?list=PLAYLIST_ID" -a -d "mi_playlist"
```

### Especificar carpeta de destino
```bash
ytcli "URL" -a -m ~/Downloads/musica
```

## ⚙️ Opciones

| Opción | Alias | Descripción |
|--------|-------|-------------|
| `--setup` | `-S` | Instalar dependencias (yt-dlp, ffmpeg) |
| `--audio` | `-a` | Descargar solo audio (MP3) |
| `--output` | `-o` | Nombre del archivo de salida |
| `--folder` | `-d` | Nombre de carpeta para playlist |
| `--music-dir` | `-m` | Directorio base de descargas |
| `--quality` | `-q` | Calidad de video (highest, high, medium, low, lowest) |
| `--verbose` | `-v` | Mostrar salida detallada |
| `--no-fallback` | | No usar yt-dlp como alternativa |
| `--help` | | Mostrar ayuda |

## 📁 Carpeta de descargas por defecto

Los archivos se guardan en:
- **macOS/Linux**: `~/Music/ytcli-downloads/`
- **Windows**: `C:\Users\TuUsuario\Music\ytcli-downloads\`

Puedes cambiarla con `-m <ruta>`.

## 🎨 Interfaz visual

La herramienta muestra una interfaz limpia con:
- Spinner animado durante la descarga
- Nombre de la canción actual
- Progreso en porcentaje
- Resumen al finalizar

```
  ♪ YouTube Downloader CLI
  ─────────────────────────

  📁 Carpeta: ~/Music/ytcli-downloads/mi_playlist
  🎵 Formato: MP3 (audio)

  🎵 Nombre de la Canción
  ⠋ Descargando (3/15) 67%

  ✔ Playlist descargada correctamente
```

## 🛠️ Desarrollo

```bash
# Clonar
git clone https://github.com/summuva/youtube-downloader-cli.git
cd youtube-downloader-cli

# Instalar dependencias
npm install

# Ejecutar localmente
node index.js "URL" -a

# Vincular globalmente para desarrollo
npm link
```

## 🐛 Solución de problemas

### Error SSL Certificate Verify Failed
El setup incluye `--no-check-certificates` para evitar problemas de SSL en macOS.

### Error 403 o decipher
Si `ytdl-core` falla, el script automáticamente usa `yt-dlp` como fallback.

### ffmpeg no encontrado
Ejecuta `ytcli --setup` o instala manualmente según tu sistema operativo.

## 📄 Licencia

[MIT License](LICENSE) - ver archivo LICENSE para más detalles.

---

**Nota legal**: Asegúrate de tener permiso para descargar y almacenar contenidos. Respeta los términos de servicio de YouTube.
