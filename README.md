# 🎵 YouTube & Spotify Downloader CLI

[![Node.js](https://img.shields.io/badge/Node.js->=16-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ytcli** es una herramienta de línea de comandos potente y modular para descargar videos, playlists de **YouTube** y pistas, álbumes y playlists de **Spotify** directamente desde tu terminal.

- ✅ Descarga videos de YouTube en múltiples formatos y calidades
- ✅ Extrae audio a MP3 automáticamente
- ✅ Descarga playlists completas
- ✅ Integración con Spotify (pistas, álbumes, playlists, artistas)
- ✅ Setup automático de dependencias
- ✅ Fallback automático entre librerías de descarga
- ✅ Interfaz visual limpia con progreso en tiempo real
- ✅ Arquitectura modular feature-based

## 🚀 Inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/summuva/youtube-downloader-cli.git
cd youtube-downloader-cli

# 2. Instalar dependencias de Node.js
npm install

# 3. Ejecutar setup (instala yt-dlp, spotdl y ffmpeg automáticamente)
npm start -- --setup

# 4. (Opcional) Instalar globalmente para usar 'ytcli' en cualquier lugar
npm link

# 5. ¡Listo! Descargar
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -a
ytcli "https://open.spotify.com/track/TRACK_ID"
```

## 📦 Requisitos

**Sistema:**
- **Node.js** >= 16
- **Python 3.8+** (para spotdl)

**Herramientas externas** (instaladas automáticamente con `--setup`):
- **yt-dlp** - Descargar de YouTube
- **spotdl** - Descargar de Spotify
- **ffmpeg** - Conversión de audio

## 🔧 Instalación manual de dependencias

Si el setup automático falla, instala manualmente según tu sistema:

### 🍎 macOS
```bash
# Usando Homebrew (recomendado)
brew install yt-dlp ffmpeg python3
pip3 install -U spotdl

# o con MacPorts
sudo port install yt-dlp ffmpeg python310
```

### 🪟 Windows
```bash
# Usando Windows Package Manager
winget install yt-dlp FFmpeg Python
pip install -U spotdl

# o con Scoop
scoop install yt-dlp ffmpeg python
```

### 🐧 Linux (Debian/Ubuntu)
```bash
# Instalación con apt
pip3 install -U yt-dlp spotdl
sudo apt install ffmpeg python3-pip

# o con dnf (Fedora/RHEL)
sudo dnf install yt-dlp ffmpeg python3-pip
pip3 install -U spotdl
```

## 🎵 Ejemplos de uso

### YouTube - Descargar audio (MP3)
```bash
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -a
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -a -o "mi_cancion"
```

### YouTube - Descargar video
```bash
ytcli "https://www.youtube.com/watch?v=VIDEO_ID"
ytcli "https://www.youtube.com/watch?v=VIDEO_ID" -q high
```

### YouTube - Descargar playlist completa
```bash
ytcli "https://www.youtube.com/playlist?list=PLAYLIST_ID" -a -d "mi_playlist"
ytcli "https://www.youtube.com/playlist?list=PLAYLIST_ID" -d "videos"
```

### Spotify - Descargar pista
```bash
ytcli "https://open.spotify.com/track/TRACK_ID"
ytcli "https://open.spotify.com/track/TRACK_ID" -o "mi_tema"
```

### Spotify - Descargar álbum
```bash
ytcli "https://open.spotify.com/album/ALBUM_ID"
ytcli "https://open.spotify.com/album/ALBUM_ID" -d "mi_album"
```

### Spotify - Descargar playlist
```bash
ytcli "https://open.spotify.com/playlist/PLAYLIST_ID"
ytcli "https://open.spotify.com/playlist/PLAYLIST_ID" -d "favoritas"
```

### Opciones avanzadas
```bash
# Especificar directorio de descarga
ytcli "URL" -m ~/Music/downloads

# Audio con máxima calidad
ytcli "https://www.youtube.com/watch?v=ID" -a -q highest

# Modo verbose para ver detalles
ytcli "URL" -a -v

# Sin fallback a yt-dlp
ytcli "URL" --no-fallback
```

## ⚙️ Opciones disponibles

| Opción | Alias | Tipo | Descripción |
|--------|-------|------|-------------|
| `--setup` | `-S` | boolean | Verificar e instalar dependencias (yt-dlp, spotdl, ffmpeg) |
| `--audio` | `-a` | boolean | Descargar solo audio (MP3) |
| `--output` | `-o` | string | Nombre del archivo de salida (sin extensión) |
| `--folder` | `-d` | string | Nombre de carpeta para guardar playlist/album |
| `--music-dir` | `-m` | string | Directorio base para descargas (por defecto: ~/Music/ytcli-downloads) |
| `--quality` | `-q` | string | Calidad de video: lowest, low, medium, high, highest (defecto: highest) |
| `--verbose` | `-v` | boolean | Mostrar salida detallada |
| `--no-fallback` | | boolean | No usar yt-dlp como alternativa si ytdl-core falla |
| `--help` | `-h` | boolean | Mostrar mensaje de ayuda |

## 📁 Carpeta de descargas por defecto

Los archivos se guardan en:
- **macOS/Linux**: `~/Music/ytcli-downloads/`
- **Windows**: `C:\Users\TuUsuario\Music\ytcli-downloads\`

Puedes cambiarla con la opción `-m <ruta>`:
```bash
ytcli "URL" -m ~/Downloads/musica
ytcli "URL" -m /media/music
ytcli "URL" -m D:\Descargas  # Windows
```

## 🏗️ Arquitectura Feature-Based

El proyecto utiliza una arquitectura modular organizada por **features**, lo que facilita mantenimiento, escalabilidad y pruebas:

```
src/
├── features/
│   ├── cli/                          # Feature CLI
│   │   ├── colors.js                 # Paleta de colores ANSI
│   │   ├── header.js                 # Cabecera y helpers de interfaz
│   │   ├── args.js                   # Parseo de argumentos (yargs)
│   │   └── utils.js                  # Utilidades de CLI
│   │
│   ├── setup/                        # Feature Setup
│   │   ├── setup.js                  # Orquestador principal
│   │   ├── installYtDlp.js           # Instalación de yt-dlp
│   │   ├── installSpotdl.js          # Instalación de spotdl
│   │   ├── installFfmpeg.js          # Instalación de ffmpeg
│   │   └── showManualInstructions.js # Guía de instalación manual
│   │
│   ├── spotify/                      # Feature Spotify
│   │   ├── spotifyHelpers.js         # Detectores y helpers
│   │   └── downloadSpotify.js        # Lógica de descarga (spotdl)
│   │
│   └── youtube/                      # Feature YouTube
│       ├── youtubeHelpers.js         # Helpers compartidos
│       ├── downloadYoutube.js        # Descarga de videos individuales
│       └── downloadPlaylist.js       # Descarga de playlists
│
├── lib/                              # Librerías compartidas
│   ├── platform.js                   # Detección SO, ejecutar comandos
│   ├── utils.js                      # Utilidades generales
│   └── paths.js                      # Manejo de paths y directorios
│
└── index.js                          # Punto de entrada (orquestador)
```

### Beneficios de esta arquitectura:

- ✅ **Modularidad**: Cada feature es independiente y testeable
- ✅ **Escalabilidad**: Agregar nuevas plataformas (TikTok, Instagram, etc.) es sencillo
- ✅ **Mantenibilidad**: Código organizado y fácil de localizar
- ✅ **Reutilización**: Librerías compartidas evitan duplicación
- ✅ **Separación de responsabilidades**: CLI, Setup, descarga y plataformas separados

## 🎨 Interfaz Visual

La herramienta proporciona una interfaz clara y moderna con:

- **Spinner animado** durante operaciones en progreso
- **Información en tiempo real** de lo que se está descargando
- **Progreso en porcentaje** para cada descarga
- **Nombres de canciones/videos** truncados elegantemente
- **Resumen final** con ubicación de archivos descargados

```
  ♪ YouTube & Spotify Downloader CLI
  ────────────────────────────────────

  🎧 Spotify - canción
  open.spotify.com/track/...

  📁 Carpeta: ~/Music/ytcli-downloads/
  🎵 Formato: MP3 320kbps

  ⠙ Conectando con Spotify...
  
  ✔ Descarga completada

  ✔ Guardado en: ~/Music/ytcli-downloads/
```

## 🛠️ Desarrollo

### Configuración local

```bash
# Clonar repositorio
git clone https://github.com/summuva/youtube-downloader-cli.git
cd youtube-downloader-cli

# Instalar dependencias
npm install

# Instalar dependencias externas
npm start -- --setup

# Ejecutar en modo desarrollo
npm start -- "URL" -a

# Vincular globalmente para testing
npm link
```

### Estructura de commits

Preferimos commits atómicos y descriptivos:
- `feat: agregar soporte para TikTok`
- `fix: corregir timeout en descargas largas`
- `refactor: mejorar estructura de downloadYoutube`
- `docs: actualizar README con ejemplos de Spotify`

### Testing

```bash
# Ejecutar tests (cuando estén disponibles)
npm test

# Test individual de un feature
npm test -- --testPathPattern=features/youtube
```

## 🐛 Solución de problemas

### Error: "yt-dlp no está instalado"
```bash
# Ejecuta setup
ytcli --setup

# O instala manualmente
pip3 install -U yt-dlp
```

### Error: "spotdl no está instalado"
```bash
# Ejecuta setup
ytcli --setup

# O instala manualmente
pip3 install -U spotdl
```

### Error SSL Certificate Verify Failed
En macOS, el setup incluye `--no-check-certificates` automáticamente. Si persiste:
```bash
# Ejecuta setup nuevamente
ytcli --setup
```

### Error 403 o "decipher" en YouTube
La app automáticamente usa `yt-dlp` como fallback si `ytdl-core` falla. Si quieres forzar el fallback:
```bash
ytcli "URL" -a -v  # modo verbose para debugging
```

### ffmpeg no encontrado
```bash
# Ejecuta setup
ytcli --setup

# O instala según tu SO
brew install ffmpeg      # macOS
winget install FFmpeg    # Windows
sudo apt install ffmpeg  # Linux
```

### Problemas con caracteres especiales en nombres
Los caracteres inválidos se reemplazan automáticamente con guiones bajos (`_`).

### La descarga toma mucho tiempo
- Verifica tu conexión a internet
- Intenta con `-q low` para videos
- Para Spotify, la velocidad depende del servidor

## 📚 Recursos

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [spotdl GitHub](https://github.com/spotify-dl/spotify-dl)
- [ffmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-best-practices/)

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el repositorio
2. **Crea una rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'feat: Add AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

### Guía de desarrollo

- Mantén el código modular y reutilizable
- Respeta la estructura feature-based
- Prueba antes de enviar PR
- Actualiza README si es necesario
- Usa nombres descriptivos en commits

## 📄 Licencia

[MIT License](LICENSE) - Eres libre de usar, modificar y distribuir este software.

## ⚠️ Disclaimer Legal

- **Contenido con derechos de autor**: Asegúrate de tener los derechos o permisos necesarios para descargar cualquier contenido.
- **Términos de servicio**: Respeta los términos de servicio de YouTube y Spotify.
- **Uso personal**: Esta herramienta está diseñada para uso personal. No la uses para distribución o venta comercial.
- **Sin responsabilidad**: Los autores no son responsables del mal uso de esta herramienta.

## 📞 Soporte

- **Issues**: Abre un [issue en GitHub](https://github.com/summuva/youtube-downloader-cli/issues)
- **Discussions**: Participa en [discussions](https://github.com/summuva/youtube-downloader-cli/discussions)
- **Wiki**: Consulta la [wiki](https://github.com/summuva/youtube-downloader-cli/wiki) para guías avanzadas

---

**Hecho con ❤️ para la comunidad**
