export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function sanitizeUrl(url) {
  let targetUrl = String(url || '').trim();
  targetUrl = targetUrl.replace(/\\+/g, '');
  try {
    targetUrl = decodeURIComponent(targetUrl);
  } catch (e) {
    // ignore
  }
  targetUrl = targetUrl.replace(/^<|>$/g, '');
  return targetUrl;
}

export function sanitizePath(str) {
  return String(str).replace(/[\\/:*?"<>|]/g, '_');
}
