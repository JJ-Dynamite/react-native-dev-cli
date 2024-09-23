const { spawn } = require('child_process');
const path = require('path');

const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const electronLauncherPath = path.join(__dirname, 'electron-launcher.js');

// Create a clean environment without NODE_OPTIONS
const env = Object.assign({}, process.env);
delete env.NODE_OPTIONS;

const electronProcess = spawn(electronPath, [electronLauncherPath], {
  stdio: 'inherit',
  env: env
});

electronProcess.on('close', (code) => {
  console.log(`Electron app exited with code ${code}`);
  process.exit(code);
});