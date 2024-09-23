import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function openEditor() {
  await ensurePackageInstalled('electron');

  const electronStartPath = path.join(__dirname, 'electron-start.js');

  const electronProcess = spawn('node', [electronStartPath], {
    stdio: 'inherit'
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron app exited with code ${code}`);
  });
}

async function ensurePackageInstalled(packageName) {
  try {
    require.resolve(packageName);
  } catch (e) {
    console.log(`Installing ${packageName}...`);
    try {
      execSync(`npm install ${packageName} --save-dev`, { stdio: 'inherit' });
      console.log(`${packageName} installed successfully.`);
    } catch (error) {
      console.error(`Failed to install ${packageName}:`, error.message);
      process.exit(1);
    }
  }
}