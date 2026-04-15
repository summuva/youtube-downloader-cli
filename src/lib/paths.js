import path from 'path';
import { sanitizePath } from './utils.js';

export function getOutputDir(baseDir, folderArg) {
  if (folderArg) {
    return path.resolve(baseDir, sanitizePath(folderArg));
  }
  return baseDir;
}

export function getSingleMediaOutputPath({
  baseDir, folderArg, outputArg, safeTitle, ext
}) {
  const dir = getOutputDir(baseDir, folderArg);
  let outName = outputArg ? String(outputArg) : safeTitle;
  
  if (path.isAbsolute(outName)) {
    return path.resolve(outName + '.' + ext);
  }
  
  return path.resolve(dir, outName + '.' + ext);
}
