import { detectOS } from "./platform.js";
import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";

export function commandExists(cmd) {
  try {
    const checkCmd = detectOS() === 'windows' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...options });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Comando "${cmd}" terminó con código ${code}`));
    });
  });
}
