#!/usr/bin/env node
import figlet from 'figlet';
import { select, input } from '@inquirer/prompts';
import { createInterface } from 'readline';
import { openEditor } from './editor/editor.js';

// Add banner
console.log(figlet.textSync('Valen', { horizontalLayout: 'full' }));
console.log('Welcome to Valen: React Native Mobile Development Kit 🚀');
console.log('A complete automation kit for React Native\n');

import { program } from 'commander';
import android from './src/commands/android.js';
import { setupCommand } from './src/commands/setup.js';
import { setupReactNative } from './reactNativeSetup.js';
import { cleanupMac } from './macCleanup.js';
import { setupIOS, handleIosOptions } from './ios.js';
import { setupAndroid, handleAndroidOptions } from './android.js';
import { handleAiderOptions } from './aider.js';
import { handleGitOptions } from './git.js';
import { exec, spawn, execSync } from 'child_process';
import { promisify } from 'util';
import { setupFastlane, handleFastlaneOptions } from './fastlane.js';
import { setupSentient } from './sentientSetup.js';
import open from 'open';
import { handleReactNativeUpgrade, handleUpgradeOption } from './upgrade.js';
import { handleAutomatedBrowsing } from './browser.js';

const execAsync = promisify(exec);

program
  .version('1.0.0')
  .description('Valen: React Native Mobile Development Kit');

program
  .option('-a, --android', 'Run Android-related commands')
  .option('-i, --ios', 'Run iOS-related commands')
  .option('-s, --setup', 'Setup the development environment')
  .option('-c, --cleanup', 'Cleanup Mac cache')
  .option('-r, --rename <name>', 'Rename the project')
  .option('-l, --logs <type>', 'Monitor logs (Metro, iOS, Android, or Reactotron)')
  .option('-f, --fastlane', 'Run Fastlane commands')
  .option('-g, --git', 'Manage Git')
  .option('-A, --ai', 'Code with AI')
  .option('-b, --browse <what to browse>', 'Automated Browsing')
  .option('-u, --upgrade <type>', 'Upgrade React Native project (web or auto)')
  .option('--app-name <name>', 'App name for upgrade')
  .option('--app-package <package>', 'App package for upgrade')
  .option('--current-version <version>', 'Current React Native version')
  .option('--target-version <version>', 'Target React Native version')
  .option('--open', 'Open the Electron text editor');

program.parse(process.argv);

const options = program.opts();

if (Object.keys(options).length === 0) {
  mainMenu();
} else {
  handleCommandLineOptions(options);
}

async function handleCommandLineOptions(options) {
  if (options.open) {
    await openEditor();
  } else if (options.upgrade) {
    await handleUpgradeOption(
      options.upgrade,
      options.appName,
      options.appPackage,
      options.currentVersion,
      options.targetVersion
    );
  } else if (options.ai) {
    await handleAiderOptions();
  } else if (options.android) {
    await handleAndroidOptions();
  } else if (options.ios) {
    await handleIosOptions();
  } else if (options.setup) {
    await setupCommand();
  } else if (options.cleanup) {
    await cleanupMac();
  } else if (options.rename) {
    await renameProject(options.rename);
  } else if (options.logs) {
    await monitorLogs(options.logs);
  } else if (options.fastlane) {
    await handleFastlaneOptions();
  } else if (options.git) {
    await handleGitOptions();
  } else if (options.browse) {
    await handleAutomatedBrowsing(options.browse);
  }
}

async function mainMenu() {
  while (true) {
    try {
      const action = await select({
        message: "What would you like to do?",
        choices: [
          { value: "Code with AI", name: "Code with AI" },
          { value: "Automated Browsing", name: "Automated Browsing" },
          { value: "Android", name: "Android" },
          { value: "iOS", name: "iOS" },
          { value: "Manage Git", name: "Manage Git" },
          { value: "Rename Project", name: "Rename Project" },
          { value: "Upgrade Project", name: "Upgrade Project" },
          { value: "Cleanup Mac Cache", name: "Cleanup Mac Cache" },
          { value: "Full Setup", name: "Full Setup" },
          { value: "Setup React Native", name: "Setup React Native" },
          { value: "Setup iOS Environment", name: "Setup iOS Environment" },
          { value: "Setup Android Environment", name: "Setup Android Environment" },
          { value: "Monitor Logs", name: "Monitor Logs" },
          { value: "Fastlane", name: "Fastlane" },
          { value: "Exit", name: "Exit" }
        ]
      });
      
      switch (action) {
        case 'Code with AI':
          await handleAiderOptions();
          break;
        case 'Full Setup':
          await cleanupMac();
          await setupReactNative();
          await setupIOS();
          await setupAndroid();
          break;
        case 'Cleanup Mac Cache':
          await cleanupMac();
          break;
        case 'Setup React Native':
          await setupReactNative();
          break;
        case 'Setup iOS Environment':
          await setupIOS();
          break;
        case 'Setup Android Environment':
          await setupAndroid();
          break;
        case 'iOS':
          await handleIosOptions();
          break;
        case 'Android':
          await handleAndroidOptions();
          break;
        case 'Manage Git':
          await handleGitOptions();
          break;
        case 'Rename Project':
          await renameProject();
          break;
        case 'Monitor Logs':
          await monitorLogs();
          break;
        case 'Fastlane':
          await handleFastlaneOptions();
          break;
        case 'Exit':
          console.log('Thank you for using Valen. Goodbye!');
          process.exit(0);
        case 'Automated Browsing':
          const query = await input({
            message: 'What would you like to browse?',
          });
          await handleAutomatedBrowsing(query);
          break;
        case 'Upgrade Project':
          await handleReactNativeUpgrade();
          break;
      }
    } catch (error) {
      console.error('An error occurred:', error);
      break;
    }
  }
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

async function renameProject(newName) {
  const { bundleId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'bundleId',
      message: 'Enter the new bundle identifier (optional, e.g., com.example.app):',
      default: ''
    }
  ]);

  try {
    let command = `npx react-native-rename "${newName}"`;
    if (bundleId) {
      command += ` -b ${bundleId}`;
    }

    console.log('Renaming project...');
    const { stdout, stderr } = await execAsync(command);
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('Project renamed successfully!');
    console.log('Please note that you may need to manually update some files and clean your project.');
    console.log('Refer to the react-native-rename documentation for more details.');
  } catch (error) {
    console.error('Error renaming project:', error.message);
  }
}

async function monitorLogs(logType) {
  if (!logType) {
    const { selectedLogType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedLogType',
        message: 'Which logs would you like to monitor?',
        choices: ['Metro', 'iOS', 'Android', 'Reactotron']
      }
    ]);
    logType = selectedLogType;
  }

  try {
    let command;
    let args;
    switch (logType) {
      case 'Metro':
        command = 'bunx';
        args = ['react-native', 'start'];
        break;
      case 'iOS':
        command = 'bunx';
        args = ['react-native', 'log-ios'];
        break;
      case 'Android':
        command = 'bunx';
        args = ['react-native', 'log-android'];
        break;
      case 'Reactotron':
        console.log('Starting Reactotron...');
        command = 'bunx';
        args = ['reactotron-cli'];
        break;
    }

    console.log(`Starting ${logType} logs...`);
    const child = spawn(command, args, { stdio: 'inherit' });
    
    // Allow the user to stop the logging process
    console.log('Press Ctrl+C to stop monitoring logs.');
    await new Promise((resolve) => {
      child.on('close', (code) => {
        console.log(`${logType} process exited with code ${code}`);
        resolve();
      });
    });
  } catch (error) {
    console.error(`Error monitoring ${logType} logs:`, error.message);
  }
}

export {
  mainMenu,
  cleanupMac,
  setupIOS,
  setupAndroid,
  handleGitOptions,
  handleAiderOptions,
  handleFastlaneOptions,
  renameProject,
  monitorLogs,
  handleAutomatedBrowsing  
};