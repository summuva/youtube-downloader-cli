import os from "os";

export function detectOS() {
  const platform = os.platform();
  if (platform === 'darwin') return 'macos';
  if (platform === 'win32') return 'windows';
  return 'linux';
}

export function detectPlatform(url) {
  if (/spotify\.com/i.test(url)) {
    return 'spotify';
  }
  if (/youtube\.com|youtu\.be|music\.youtube\.com/i.test(url)) {
    return 'youtube';
  }
  return 'unknown';
}

export function getSpotifyType(url) {
  if (/\/track\//i.test(url)) return 'track';
  if (/\/album\//i.test(url)) return 'album';
  if (/\/playlist\//i.test(url)) return 'playlist';
  if (/\/artist\//i.test(url)) return 'artist';
  return 'unknown';
}
