import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const electronLauncherPath = path.join(__dirname, 'electron-launcher.js');

console.log('Launching Electron app...');
console.log('Electron path:', electronPath);
console.log('Launcher path:', electronLauncherPath);

// Create a clean environment without NODE_OPTIONS
const env = Object.assign({}, process.env);
delete env.NODE_OPTIONS;

const electronProcess = spawn(electronPath, [electronLauncherPath], {
  stdio: 'inherit',
  env: env
});

electronProcess.on('error', (error) => {
  console.error('Failed to start Electron process:', error);
});

electronProcess.on('close', (code) => {
  console.log(`Electron app exited with code ${code}`);
  process.exit(code);
});