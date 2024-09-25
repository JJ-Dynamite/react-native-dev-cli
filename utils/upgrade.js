const { exec, execSync } = require('child_process');
const { createInterface } = require('readline');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');
const ejs = require('ejs');
const ora = require('ora');
const yaml = require('js-yaml');
const chalk = require('chalk');
const diff = require('diff');
const open = require('open').default;
const { alignDeps } = require('./upgradeFunctions');
const os = require('os');
const dirTree = require('directory-tree');
const treeify = require('treeify');
const Anthropic = require('@anthropic-ai/sdk');
const Groq = require('groq-sdk');
const glob = require('glob');
const { applyPatchUsingAI } = require('./aiHelpers');
const { generateDiff } = require('./diffUtils');
const { ensurePackagesInstalled } = require('./global-utils');

let inquirer;

async function initializeInquirer() {
  if (!inquirer) {
    inquirer = (await import('inquirer')).default;
  }
  return inquirer;
}

async function promptUpgradeInfo() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  const answers = {
    appName: await question("What's your app name? "),
    appPackage: await question("What's your app package? "),
    currentVersion: await question("What's your current react-native version? "),
    targetVersion: await question("To which version would you like to upgrade? ")
  };

  rl.close();
  return answers;
}

async function openUpgradeHelperInBrowser(answers) {
  const { appName, appPackage, currentVersion, targetVersion } = answers;
  const url = `https://react-native-community.github.io/upgrade-helper/?from=${currentVersion}&to=${targetVersion}&name=${encodeURIComponent(appName)}&package=${encodeURIComponent(appPackage)}`;

  console.log(`Opening React Native Upgrade Helper in your default browser...`);
  console.log(`App Name: ${appName}`);
  console.log(`App Package: ${appPackage}`);
  console.log(`Upgrading from version ${currentVersion} to ${targetVersion}`);

  exec(`open "${url}"`, (error) => {
    if (error) {
      console.error('Failed to open the browser:', error);
    } else {
      console.log('Browser opened successfully.');
    }
  });
}

async function autoUpgradeWithNewBranch(answers) {
  const inquirer = await initializeInquirer();
  const { appName, appPackage, currentVersion, targetVersion } = answers;
  const branchName = `upgrade-${currentVersion}-to-${targetVersion}`;

  // Check if current directory is a React Native project
  console.log('Checking if the current directory is a React Native project...');
  if (!(await isReactNativeProject())) {
    console.error('Error: The current directory does not appear to be a React Native project.');
    console.log('Please ensure you are in the root directory of a React Native project.');
    console.log('Current directory contents:');
    const files = await fs.readdir(process.cwd());
    console.log(files.join('\n'));
    return;
  }

  console.log('Confirmed: This is a React Native project.');

  console.log('Ensuring all necessary packages are installed...');
  await ensurePackagesInstalled();

  console.log(`Checking for branch: ${branchName}`);
  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: 'ignore' });
    console.log(`Branch ${branchName} already exists. Switching to it.`);
    execSync(`git checkout ${branchName}`);
  } catch (error) {
    console.log(`Creating new branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`);
    console.log(`Created new branch: ${branchName}`);
  }

  console.log(`Upgrading ${appName} from ${currentVersion} to ${targetVersion}`);

  try {
    // Ask user before running align-deps
    const { runAlignDeps } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'runAlignDeps',
        message: 'Do you want to run align-deps before fetching the upgrade diff?',
        default: true
      }
    ]);

    if (runAlignDeps) {
      console.log('Running align-deps...');
      const alignResult = await alignDeps(targetVersion, { write: true, verbose: true });
      if (!alignResult) {
        console.log('align-deps encountered an error, but we will proceed with the upgrade.');
        // You might want to ask the user if they want to continue here
      }
    } else {
      console.log('Skipping align-deps...');
    }

    console.log('Fetching upgrade diff...');
    const diffUrl = `https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/${currentVersion}..${targetVersion}.diff`;
    const response = await axios.get(diffUrl);
    const diffContent = response.data;
    console.log(`Fetched diff content (${diffContent.length} characters)`);

    console.log('Generating basic upgrade plan from diff...');
    const upgradePlan = generateBasicUpgradePlan(diffContent, appName, appPackage);

    // Ask for user confirmation before applying changes
    const { confirmApply } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmApply',
        message: 'Do you want to proceed with applying the upgrade changes?',
        default: true
      }
    ]);

    if (!confirmApply) {
      console.log('Upgrade process cancelled by user.');
      return;
    }

    console.log('Applying upgrade changes...');
    await applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer);

    console.log('Running React Native upgrade command...');
    execSync(`npx react-native upgrade --to ${targetVersion}`, { stdio: 'inherit' });

    console.log('Upgrade completed successfully.');
    console.log(`Please review the changes in the branch: ${branchName}`);
    console.log('After reviewing, you can merge this branch into your main branch if everything looks good.');
  } catch (error) {
    console.error('Error during auto-upgrade:', error.message);
    console.log('Falling back to manual upgrade...');
    
    // Ask for user confirmation before opening the browser
    const { confirmOpenBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmOpenBrowser',
        message: 'Do you want to open the React Native Upgrade Helper in your browser?',
        default: true
      }
    ]);

    if (confirmOpenBrowser) {
      await openUpgradeHelperInBrowser(answers);
    } else {
      console.log('Manual upgrade process cancelled by user.');
    }
  }
}

function generateBasicUpgradePlan(diffContent, appName, appPackage) {
  const upgradePlan = { steps: [] };
  const lines = diffContent.split('\n');
  let currentFile = null;
  let currentChanges = [];

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        upgradePlan.steps.push({
          description: `Update ${replaceAppNameAndPackage(currentFile, appName, appPackage)}`,
          fileChanges: [{ file: replaceAppNameAndPackage(currentFile, appName, appPackage), content: currentChanges.join('\n') }]
        });
        currentChanges = [];
      }
      currentFile = line.split(' b/')[1];
    } else if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
      currentChanges.push(replaceAppNameAndPackage(line, appName, appPackage));
    }
  }

  if (currentFile) {
    upgradePlan.steps.push({
      description: `Update ${replaceAppNameAndPackage(currentFile, appName, appPackage)}`,
      fileChanges: [{ file: replaceAppNameAndPackage(currentFile, appName, appPackage), content: currentChanges.join('\n') }]
    });
  }

  try {
    if (typeof chalk !== 'undefined' && chalk.bold && chalk.cyan) {
      console.log(chalk.bold.cyan('\nBasic upgrade plan generated from diff content:'));
      console.log(chalk.yellow('='.repeat(80)));

      upgradePlan.steps.forEach((step, index) => {
        console.log(chalk.green(`\nStep ${index + 1}: ${step.description}`));
        step.fileChanges.forEach(change => {
          console.log(chalk.blue(`  File: ${change.file}`));
          const lines = change.content.split('\n');
          lines.forEach(line => {
            if (line.startsWith('+')) {
              console.log(chalk.green(`    ${line}`));
            } else if (line.startsWith('-')) {
              console.log(chalk.red(`    ${line}`));
            } else {
              console.log(chalk.gray(`    ${line}`));
            }
          });
        });
      });

      console.log(chalk.yellow('='.repeat(80)));
    } else {
      // Fallback to non-colored output
      console.log('\nBasic upgrade plan generated from diff content:');
      console.log('='.repeat(80));

      upgradePlan.steps.forEach((step, index) => {
        console.log(`\nStep ${index + 1}: ${step.description}`);
        step.fileChanges.forEach(change => {
          console.log(`  File: ${change.file}`);
          console.log(change.content);
        });
      });

      console.log('='.repeat(80));
    }
  } catch (error) {
    console.error('Error formatting upgrade plan:', error);
    console.log('\nBasic upgrade plan generated from diff content:');
    console.log(JSON.stringify(upgradePlan, null, 2));
  }

  return upgradePlan;
}

async function applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer) {
  console.log('Applying upgrade changes based on diff content:');
  console.log('Current working directory:', process.cwd());

  if (!upgradePlan.steps || upgradePlan.steps.length === 0) {
    console.log('Upgrade plan is empty. No changes to apply.');
    return;
  }

  const patchesDir = path.join(process.cwd(), '.upgrade-patches');
  console.log(`Attempting to create patches directory: ${patchesDir}`);
  
  try {
    await fs.mkdir(patchesDir, { recursive: true });
    console.log(`Patches directory created successfully: ${patchesDir}`);
  } catch (error) {
    console.error(`Error creating patches directory: ${error.message}`);
    console.error('Error stack:', error.stack);
    return;
  }

  try {
    console.log('Generating patch files...');
    await generateAllPatches(upgradePlan, diffContent, patchesDir, appName, appPackage);
    
    console.log('Attempting to read patches directory...');
    const patchFiles = await fs.readdir(patchesDir);
    console.log(`Patches generated. Contents of ${patchesDir}:`);
    patchFiles.forEach(file => console.log(` - ${file}`));

    // Apply changes using generated patches
    for (const step of upgradePlan.steps) {
      console.log(`\nStep: ${step.description}`);
      
      if (step.fileChanges) {
        for (const change of step.fileChanges) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Do you want to apply changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}?`,
              default: true
            }
          ]);
          
          if (confirm) {
            try {
              await applyPatchFile(change, patchesDir, appName, appPackage, inquirer, targetVersion);
            } catch (error) {
              console.error(`Error applying change to ${replaceAppNameAndPackage(change.file, appName, appPackage)}:`, error.message);
              
              const { action } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'action',
                  message: 'How would you like to proceed?',
                  choices: ['Skip this change', 'Try manual edit', 'Abort upgrade']
                }
              ]);

              switch (action) {
                case 'Skip this change':
                  console.log(`Skipped changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}`);
                  break;
                case 'Try manual edit':
                  await manualEdit(change, appName, appPackage);
                  break;
                case 'Abort upgrade':
                  throw new Error('Upgrade aborted by user');
              }
            }
          } else {
            console.log(`Skipped changes to ${replaceAppNameAndPackage(change.file, appName, appPackage)}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during upgrade process:', error.message);
    console.error('Error stack:', error.stack);
    
    // Add overall error recovery options
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: ['Retry upgrade', 'Abort upgrade']
      }
    ]);

    if (action === 'Retry upgrade') {
      console.log('Retrying upgrade process...');
      return applyUpgradeChanges(upgradePlan, diffContent, appName, appPackage, targetVersion, inquirer);
    } else {
      console.log('Upgrade process aborted.');
      process.exit(1);
    }
  }
  
  console.log('\nUpgrade changes applied. Please review the changes before proceeding.');
}

async function generateAllPatches(upgradePlan, diffContent, patchesDir, appName, appPackage) {
  for (const step of upgradePlan.steps) {
    if (step.fileChanges) {
      for (const change of step.fileChanges) {
        let filePath = replaceAppNameAndPackage(change.file, appName, appPackage);
        
        // Remove the app name from the beginning of the file path for root files
        if (filePath.startsWith(`${appName}/`)) {
          filePath = filePath.slice(appName.length + 1);
        }
        
        // Remove duplicate 'app' in the path
        filePath = filePath.replace(/\/app\/app\//g, '/app/');
        
        const patchContent = generatePatchContent(filePath, change.content);
        const patchFileName = `${filePath.replace(/\//g, '_')}.patch`;
        const patchFilePath = path.join(patchesDir, patchFileName);
        
        await fs.writeFile(patchFilePath, patchContent);
        console.log(`Generated patch file: ${patchFilePath}`);
      }
    }
  }
}

function generatePatchContent(filePath, changes) {
  // Remove the unnecessary header
  return changes;
}

async function isReactNativeProject() {
  const requiredFiles = ['package.json', 'app.json'];
  const optionalFiles = ['App.js', 'index.js', 'metro.config.js', 'babel.config.js', 'react-native.config.js'];

  try {
    // Check for required files
    for (const file of requiredFiles) {
      await fs.access(path.join(process.cwd(), file));
    }

    // Check package.json for react-native dependency
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    if (!packageJson.dependencies || !packageJson.dependencies['react-native']) {
      return false;
    }

    // Check for at least one of the optional files
    for (const file of optionalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        return true; // If any optional file exists, it's likely a React Native project
      } catch (error) {
        // Ignore errors, just continue checking other files
      }
    }

    return true; // If we've made it this far, it's likely a React Native project
  } catch (error) {
    console.error('Error checking React Native project:', error);
    return false; // If any required file is missing or there's an error
  }
}

async function handleReactNativeUpgrade() {
  const inquirer = await initializeInquirer();
  const answers = await promptUpgradeInfo();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Auto upgrade with new branch',
        'Open in web browser',
        'Cancel'
      ]
    }
  ]);

  switch (action) {
    case 'Open in web browser':
      const { confirmOpen } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmOpen',
          message: 'Do you want to open the React Native Upgrade Helper in your web browser?',
          default: true
        }
      ]);
      if (confirmOpen) {
        await openUpgradeHelperInBrowser(answers);
      } else {
        console.log('Web browser opening cancelled.');
      }
      break;
    case 'Auto upgrade with new branch':
      const spinner = ora('Processing upgrade...').start();
      try {
        await autoUpgradeWithNewBranch(answers, inquirer);
        spinner.succeed('Upgrade process completed.');
      } catch (error) {
        spinner.fail('Upgrade process failed.');
        console.error('Error:', error.message);
      }
      break;
    case 'Cancel':
      console.log('Upgrade cancelled.');
      break;
  }
}

async function handleUpgradeOption(type, appName, appPackage, currentVersion, targetVersion) {
  const inquirer = await initializeInquirer();
  let answers;
  if (appName && appPackage && currentVersion && targetVersion) {
    answers = { appName, appPackage, currentVersion, targetVersion };
  } else {
    answers = await promptUpgradeInfo();
  }

  if (type === 'web') {
    await openUpgradeHelperInBrowser(answers);
  } else if (type === 'auto') {
    await autoUpgradeWithNewBranch(answers, inquirer);
  } else {
    console.log('Invalid upgrade type. Use "web" or "auto".');
  }
}

function replaceAppNameAndPackage(content, appName, appPackage) {
  return content
    // Replace the template app name
    .replace(/RnDiffApp/g, appName)
    // Replace the template package name
    .replace(/com\.rndiffapp/g, appPackage)
    .replace(/com\/rndiffapp/g, appPackage.replace(/\./g, '/'));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function applyPatchFile(change, patchesDir, appName, appPackage, inquirer, targetVersion) {
  let filePath = replaceAppNameAndPackage(change.file, appName, appPackage);
  
  // Remove the app name from the beginning of the file path for root files
  if (filePath.startsWith(`${appName}/`)) {
    filePath = filePath.slice(appName.length + 1);
  }
  
  // Remove duplicate 'app' in the path
  filePath = filePath.replace(/\/app\/app\//g, '/app/');
  
  // Special case for gradle-wrapper.jar
  if (filePath.endsWith('gradle/wrapper/gradle-wrapper.jar')) {
    const { confirmDownload } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDownload',
        message: `Do you want to download the new gradle-wrapper.jar for version ${targetVersion}?`,
        default: true
      }
    ]);

    if (confirmDownload) {
      const url = `https://raw.githubusercontent.com/react-native-community/rn-diff-purge/release/${targetVersion}/RnDiffApp/android/gradle/wrapper/gradle-wrapper.jar`;
      console.log(`Downloading gradle-wrapper.jar from: ${url}`);
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await fs.writeFile(filePath, response.data);
        console.log(`Successfully downloaded and saved gradle-wrapper.jar to ${filePath}`);
        return;
      } catch (error) {
        console.error(`Error downloading gradle-wrapper.jar: ${error.message}`);
        console.log('Skipping this change. Please download the file manually.');
        return;
      }
    } else {
      console.log('Skipping download of gradle-wrapper.jar');
      return;
    }
  }

  const patchFileName = `${filePath.replace(/\//g, '_')}.patch`;
  const patchFilePath = path.join(patchesDir, patchFileName);

  console.log(`Applying patch to ${filePath}...`);
  console.log(`Looking for patch file: ${patchFilePath}`);
  
  // Check if the target file exists
  if (!await fileExists(filePath)) {
    console.log(`File ${filePath} does not exist.`);
    
    let action;
    do {
      ({ action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: `${filePath} doesn't exist. What would you like to do?`,
          choices: [
            'Search for file',
            'Specify correct path',
            'Create new file',
            'Skip this change'
          ]
        }
      ]));

      if (action === 'Search for file') {
        const searchResult = await searchForFile(filePath, inquirer);
        if (searchResult === 'GO_BACK') {
          continue;  // Go back to the action selection
        } else if (searchResult && searchResult.action === 'CREATE_NEW') {
          action = 'Create new file';
          filePath = searchResult.path;
        } else if (searchResult) {
          filePath = searchResult;
          break;
        } else {
          console.log('File not found. Please choose another action.');
          continue;
        }
      }

      if (action === 'Specify correct path') {
        const { correctPath } = await inquirer.prompt([
          {
            type: 'input',
            name: 'correctPath',
            message: 'Enter the correct file path (relative to project root):',
            default: filePath
          }
        ]);
        filePath = correctPath;
      } else if (action === 'Create new file') {
        console.log(`Creating new file: ${filePath}`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, '');
      } else if (action === 'Skip this change') {
        console.log('Skipping this change.');
        return;
      }
    } while (action === 'Search for file');
  }

  // Read the patch content
  let patchContent;
  try {
    patchContent = await fs.readFile(patchFilePath, 'utf8');
    console.log('Original patch content:', patchContent);
  } catch (error) {
    console.error(`Error reading patch file: ${error.message}`);
    console.error(`Full path of patch file: ${path.resolve(patchFilePath)}`);
    console.error(`Directory contents of ${patchesDir}:`, await fs.readdir(patchesDir));
    return;
  }
  
  if (!patchContent.trim()) {
    console.error('Patch file is empty. Skipping this change.');
    return;
  }

  // Check if the patch is removing the file
  if (patchContent.includes('+++ /dev/null')) {
    console.log(`The patch is removing the file ${filePath}`);
    const { confirmRemove } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmRemove',
        message: `Do you want to remove the file ${filePath}?`,
        default: false
      }
    ]);

    if (confirmRemove) {
      try {
        await fs.unlink(filePath);
        console.log(`File ${filePath} has been removed.`);
      } catch (error) {
        console.error(`Error removing file ${filePath}:`, error.message);
      }
    } else {
      console.log(`File ${filePath} was not removed.`);
    }
    return;
  }

  // Replace template placeholders with actual app name and package in the entire patch content
  let updatedPatchContent = replaceAppNameAndPackage(patchContent, appName, appPackage);
  
  // Update the file paths in the patch header
  updatedPatchContent = updatedPatchContent.replace(
    /^--- a\/.+$/m,
    `--- a/${filePath}`
  ).replace(
    /^\+\+\+ b\/.+$/m,
    `+++ b/${filePath}`
  );
  
  console.log('Updated patch content:', updatedPatchContent);

  // Write the updated patch content to a temporary file
  const tempPatchFile = path.join(patchesDir, `temp_${patchFileName}`);
  await fs.writeFile(tempPatchFile, updatedPatchContent);

  // Apply the patch using Git's apply command
  try {
    execSync(`git apply ${tempPatchFile}`, { stdio: 'inherit' });
    console.log(`Patch applied successfully to ${filePath}.`);
  } catch (error) {
    console.error(`Error applying patch to ${filePath} using git apply:`, error.message);
    console.log('Attempting to use AI to apply the patch...');
    await applyPatchUsingAI(filePath, patchFilePath, inquirer);
  } finally {
    // Clean up the temporary patch file
    await fs.unlink(tempPatchFile);
  }
}

async function searchForFile(targetFile, inquirer) {
  const searchDir = process.cwd();
  const files = await walkDir(searchDir);

  const similarFiles = files.filter(file => 
    file.toLowerCase().includes(path.basename(targetFile).toLowerCase())
  );

  if (similarFiles.length === 0) {
    console.log('No similar files found.');
    return null;
  }

  const { selectedOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedOption',
      message: 'Select the correct file or choose an action:',
      choices: [
        ...similarFiles,
        new inquirer.Separator(),
        'Go back',
        'Create new file',
        'None of these'
      ]
    }
  ]);

  switch (selectedOption) {
    case 'Go back':
      return 'GO_BACK';
    case 'Create new file':
      const { newFilePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newFilePath',
          message: 'Enter the path for the new file:',
          default: targetFile,
          validate: async (input) => {
            if (!input) return 'File path cannot be empty';
            if (await fileExists(input)) return 'File already exists. Please choose a different path.';
            return true;
          }
        }
      ]);
      const { confirmPath } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmPath',
          message: `Is this path correct: ${newFilePath}?`,
          default: true
        }
      ]);
      if (confirmPath) {
        return { action: 'CREATE_NEW', path: newFilePath };
      } else {
        console.log('Returning to file selection...');
        return 'GO_BACK';
      }
    case 'None of these':
      return null;
    default:
      // The file was found and selected
      return selectedOption;
  }
}

async function walkDir(dir) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files = files.concat(await walkDir(fullPath));
      }
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

module.exports = {
  handleReactNativeUpgrade,
  handleUpgradeOption,
  promptUpgradeInfo,
  openUpgradeHelperInBrowser,
  autoUpgradeWithNewBranch,
  generateBasicUpgradePlan,
  applyUpgradeChanges,
  generateAllPatches,
  generatePatchContent,
  isReactNativeProject,
  replaceAppNameAndPackage,
  applyPatchFile,
  fileExists,
  searchForFile,
  walkDir,
};


