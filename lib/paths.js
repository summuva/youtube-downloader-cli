import path from "path";

export function getOutputDir(baseDir, folderArg) {
  if (folderArg) {
    return path.resolve(baseDir, String(folderArg).replace(/[\\/:*?"<>|]/g, "_"));
  }
  return baseDir;
}

export function getSingleMediaOutputPath({ baseDir, folderArg, outputArg, safeTitle, ext }) {
  const dir = getOutputDir(baseDir, folderArg);
  let outName = outputArg ? String(outputArg) : safeTitle;
  if (path.isAbsolute(outName)) {
    return path.resolve(outName + "." + ext);
  }
  return path.resolve(dir, outName + "." + ext);
}
