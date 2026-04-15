import path from 'path';
import { sanitizePath } from '../../lib/utils.js';
import { getSingleMediaOutputPath as getOutputPath } from '../../lib/paths.js';

export function getOutputDir(baseDir, folderArg) {
  if (folderArg) {
    return path.resolve(baseDir, sanitizePath(folderArg));
  }
  return baseDir;
}

export function getSingleMediaOutputPath(params) {
  return getOutputPath(params);
}
