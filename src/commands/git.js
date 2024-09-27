import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function handleGitOptions() {
  console.log('Managing Git');
  
  // Check and update Git Flow configurations
  await checkAndUpdateGitConfig();

  try {
    // Check if Git Flow is installed
    execSync('git flow version', { stdio: 'ignore' });
  } catch (error) {
    console.log('Git Flow is not installed. Installing now...');
    try {
      execSync('brew install git-flow', { stdio: 'inherit' });
    } catch (installError) {
      console.error('Failed to install Git Flow:', installError.message);
      return;
    }
  }

  const choices = [
    { name: 'LazyGit', value: 'lazygit' },
    { name: 'Git Flow Options', value: 'gitflow' },
    { name: 'Exit', value: 'exit' },
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose a Git action:',
      choices,
    },
  ]);

  if (action === 'lazygit') {
    runLazyGit();
  } else if (action === 'gitflow') {
    await handleGitFlowOptions();
  }
}

function runLazyGit() {
  try {
    execSync('lazygit', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running LazyGit:', error.message);
  }
}

async function handleGitFlowOptions() {
  try {
    // Check if Git Flow is initialized
    execSync('git flow config', { stdio: 'ignore' });
  } catch (error) {
    console.log('Git Flow is not initialized in this repository.');
    const { shouldInit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInit',
        message: 'Would you like to initialize Git Flow?',
        default: true,
      },
    ]);

    if (shouldInit) {
      await initializeGitFlow();
    } else {
      console.log('Aborting Git Flow operations.');
      return;
    }
  }

  const gitFlowChoices = [
    { name: 'Feature', value: 'feature' },
    { name: 'Release', value: 'release' },
    { name: 'Hotfix', value: 'hotfix' },
    { name: 'Initialize Git Flow', value: 'init' },
    { name: 'List branches', value: 'list' },
    { name: 'Pull updates', value: 'pull' },
    { name: 'Switch to develop', value: 'develop' },
    { name: 'Switch to main', value: 'main' },
    { name: 'Show Git Flow status', value: 'status' },
    { name: 'Back', value: 'back' },
  ];

  const { flowAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'flowAction',
      message: 'Choose a Git Flow action:',
      choices: gitFlowChoices,
    },
  ]);

  switch (flowAction) {
    case 'feature':
      await handleFeatureActions();
      break;
    case 'release':
      await handleReleaseActions();
      break;
    case 'hotfix':
      await handleHotfixActions();
      break;
    case 'init':
      await initializeGitFlow();
      break;
    case 'list':
      await listBranches();
      break;
    case 'pull':
      await pullUpdates();
      break;
    case 'develop':
      execSync('git checkout develop && git pull origin develop', { stdio: 'inherit' });
      break;
    case 'main':
      execSync('git checkout main && git pull origin main', { stdio: 'inherit' });
      break;
    case 'status':
      execSync('git flow status', { stdio: 'inherit' });
      break;
    case 'back':
      await handleGitOptions();
      break;
  }
}

async function checkAndUpdateGitConfig() {
  const gitConfigPath = path.join(os.homedir(), '.gitconfig');
  let gitConfig = '';

  try {
    gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
  } catch (error) {
    console.log('Creating new .gitconfig file');
  }

  const gitFlowAliases = `
[alias]
    # Feature
    ffs = flow feature start
    fff = flow feature finish
    ffp = flow feature publish
    ffpl = flow feature pull

    # Release
    frs = flow release start
    frf = flow release finish
    frp = flow release publish

    # Hotfix
    fhs = flow hotfix start
    fhf = flow hotfix finish

    # General Git Flow
    fi = flow init

    # Develop branch
    fio = flow init -d

    # List all feature branches
    fl = "!git flow feature list"

    # List all release branches
    frl = "!git flow release list"

    # List all hotfix branches
    fhl = "!git flow hotfix list"

    # Pull updates for a feature branch
    ffpu = "!f() { git checkout feature/$1 && git pull origin feature/$1; }; f"

    # Pull updates for a release branch
    frpu = "!f() { git checkout release/$1 && git pull origin release/$1; }; f"

    # Pull updates for a hotfix branch
    fhpu = "!f() { git checkout hotfix/$1 && git pull origin hotfix/$1; }; f"

    # Shortcut to finish feature and push changes
    fffp = "!f() { git flow feature finish $1 && git push origin develop; }; f"

    # Shortcut to finish release and push changes
    frfp = "!f() { git flow release finish $1 && git push --tags && git push origin develop && git push origin main; }; f"

    # Shortcut to finish hotfix and push changes
    fhfp = "!f() { git flow hotfix finish $1 && git push --tags && git push origin develop && git push origin main; }; f"

    # Show current Git Flow status
    fst = "!git flow status"

    # Switch to develop branch and pull latest changes
    fgd = "!git checkout develop && git pull origin develop"

    # Switch to main branch and pull latest changes
    fgm = "!git checkout main && git pull origin main"
`;

  if (!gitConfig.includes('[alias]')) {
    gitConfig += gitFlowAliases;
    fs.writeFileSync(gitConfigPath, gitConfig);
    console.log('Git Flow aliases added to .gitconfig');
  } else if (!gitConfig.includes('ffs = flow feature start')) {
    const aliasSection = gitConfig.indexOf('[alias]');
    const updatedConfig = gitConfig.slice(0, aliasSection) + gitFlowAliases + gitConfig.slice(aliasSection);
    fs.writeFileSync(gitConfigPath, updatedConfig);
    console.log('Git Flow aliases updated in .gitconfig');
  } else {
    console.log('Git Flow aliases already present in .gitconfig');
  }
}

async function handleFeatureActions() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose a feature action:',
      choices: [
        { name: 'Start feature', value: 'start' },
        { name: 'Finish feature', value: 'finish' },
        { name: 'Publish feature', value: 'publish' },
        { name: 'Pull feature', value: 'pull' },
      ],
    },
  ]);

  const { branchName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'branchName',
      message: 'Enter the feature branch name:',
    },
  ]);

  switch (action) {
    case 'start':
      execSync(`git flow feature start ${branchName}`, { stdio: 'inherit' });
      break;
    case 'finish':
      execSync(`git flow feature finish ${branchName}`, { stdio: 'inherit' });
      break;
    case 'publish':
      execSync(`git flow feature publish ${branchName}`, { stdio: 'inherit' });
      break;
    case 'pull':
      execSync(`git checkout feature/${branchName} && git pull origin feature/${branchName}`, { stdio: 'inherit' });
      break;
  }
}

async function handleReleaseActions() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose a release action:',
      choices: [
        { name: 'Start release', value: 'start' },
        { name: 'Finish release', value: 'finish' },
        { name: 'Publish release', value: 'publish' },
      ],
    },
  ]);

  const { version } = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'Enter the release version:',
    },
  ]);

  switch (action) {
    case 'start':
      execSync(`git flow release start ${version}`, { stdio: 'inherit' });
      break;
    case 'finish':
      execSync(`git flow release finish ${version}`, { stdio: 'inherit' });
      break;
    case 'publish':
      execSync(`git flow release publish ${version}`, { stdio: 'inherit' });
      break;
  }
}

async function handleHotfixActions() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose a hotfix action:',
      choices: [
        { name: 'Start hotfix', value: 'start' },
        { name: 'Finish hotfix', value: 'finish' },
      ],
    },
  ]);

  const { version } = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'Enter the hotfix version:',
    },
  ]);

  switch (action) {
    case 'start':
      execSync(`git flow hotfix start ${version}`, { stdio: 'inherit' });
      break;
    case 'finish':
      execSync(`git flow hotfix finish ${version}`, { stdio: 'inherit' });
      break;
  }
}

async function initializeGitFlow() {
  try {
    console.log('Checking for unstaged changes...');
    try {
      execSync('git diff --exit-code', { stdio: 'ignore' });
    } catch (error) {
      console.log('There are unstaged changes in your repository.');
      const { shouldStash } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldStash',
          message: 'Would you like to stash these changes before initializing Git Flow?',
          default: true,
        },
      ]);

      if (shouldStash) {
        console.log('Stashing changes...');
        execSync('git stash', { stdio: 'inherit' });
      } else {
        console.log('Aborting Git Flow initialization due to unstaged changes.');
        return;
      }
    }

    console.log('Initializing Git Flow...');
    execSync('git flow init -d', { stdio: 'inherit' });
    console.log('Git Flow initialized successfully.');
  } catch (error) {
    console.error('Error initializing Git Flow:', error.message);
  }
}

async function listBranches() {
  try {
    // Check if the current repository is Git Flow enabled
    execSync('git flow config', { stdio: 'ignore' });
  } catch (error) {
    console.log('This repository is not Git Flow enabled.');
    const { shouldInit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldInit',
        message: 'Would you like to initialize Git Flow in this repository?',
        default: true,
      },
    ]);

    if (shouldInit) {
      await initializeGitFlow();
    } else {
      console.log('Aborting branch listing.');
      return;
    }
  }

  try {
    console.log('Feature branches:');
    execSync('git flow feature list', { stdio: 'inherit' });
    console.log('\nRelease branches:');
    execSync('git flow release list', { stdio: 'inherit' });
    console.log('\nHotfix branches:');
    execSync('git flow hotfix list', { stdio: 'inherit' });
  } catch (error) {
    if (error.message.includes('Not a gitflow-enabled repo yet')) {
      console.log('Git Flow is not properly initialized. Please run the "Initialize Git Flow" option first.');
    } else {
      console.error('Error listing branches:', error.message);
    }
  }
}

async function pullUpdates() {
  const { branchType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branchType',
      message: 'Choose the branch type to pull updates:',
      choices: [
        { name: 'Feature', value: 'feature' },
        { name: 'Release', value: 'release' },
        { name: 'Hotfix', value: 'hotfix' },
      ],
    },
  ]);

  const { branchName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'branchName',
      message: `Enter the ${branchType} branch name:`,
    },
  ]);

  execSync(`git checkout ${branchType}/${branchName} && git pull origin ${branchType}/${branchName}`, { stdio: 'inherit' });
}