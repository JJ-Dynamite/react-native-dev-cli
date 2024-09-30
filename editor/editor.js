import { spawn } from 'child_process';
import { join } from 'path';
import fs from 'fs';

export async function openEditor() {
  console.log('Opening Electron editor...');
  
  try {
    await ensureElectronInstalled();

    const electronPath = await getElectronPath();
    const launcherPath = join(__dirname, 'electron-launcher.js');

    console.log('Launching Electron app...');
    console.log('Electron path:', electronPath);
    console.log('Launcher path:', launcherPath);

    return new Promise((resolve, reject) => {
      const child = spawn(electronPath, [launcherPath], { stdio: 'inherit' });

      child.on('close', (code) => {
        console.log(`Electron app closed with code ${code}`);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Electron app exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('Failed to open Electron editor:', error.message);
    throw error;
  }
}

async function ensureElectronInstalled() {
  try {
    await import('electron');
  } catch (e) {
    console.log('Electron not found. Attempting to install...');
    await installElectron();
  }

  // Double-check if Electron is now installed
  try {
    await import('electron');
  } catch (e) {
    throw new Error('Failed to install Electron. Please install it manually using "bun add electron --dev"');
  }
}

async function installElectron() {
  try {
    // Remove the existing electron directory if it exists
    const electronPath = join(process.cwd(), 'node_modules', 'electron');
    if (fs.existsSync(electronPath)) {
      fs.rmSync(electronPath, { recursive: true, force: true });
    }

    // Install electron using Bun
    console.log('Installing Electron...');
    await new Promise((resolve, reject) => {
      const child = spawn('bun', ['add', 'electron', '--dev'], { stdio: 'inherit' });
      child.on('close', (code) => {
        if (code === 0) {
          console.log('Electron installed successfully.');
          resolve();
        } else {
          reject(new Error(`Failed to install Electron. Exit code: ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('Error installing Electron:', error.message);
    throw error;
  }
}

async function getElectronPath() {
  try {
    const electronModule = await import('electron');
    return electronModule.default;
  } catch (error) {
    throw new Error('Failed to get Electron path. Make sure Electron is installed correctly.');
  }
}