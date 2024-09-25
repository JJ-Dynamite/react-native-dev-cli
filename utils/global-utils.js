const { execSync } = require('child_process');

async function ensurePackagesInstalled() {
  const packages = ['axios', 'anthropic', 'openai', 'gluegun', 'ejs', 'ora', 'cli-progress', 'js-yaml', 'inquirer', 'chalk', 'diff', 'open', 'os'];

  for (const pkg of packages) {
    try {
      // Check if the package is globally installed
      await execSync(`bun pm ls -g ${pkg}`, { stdio: 'ignore' });
      console.log(`${pkg} is already installed globally.`);
    } catch (error) {
      console.log(`Installing ${pkg} globally...`);
      try {
        // Use npm for global installation as Bun doesn't support it directly
        await execSync(`npm install -g ${pkg}`, { stdio: 'inherit' });
        console.log(`${pkg} installed globally successfully.`);
      } catch (installError) {
        console.error(`Failed to install ${pkg} globally:`, installError.message);
        console.log(`Attempting to install ${pkg} locally...`);
        try {
          await execSync(`bun add ${pkg}`, { stdio: 'inherit' });
          console.log(`${pkg} installed locally successfully.`);
        } catch (localInstallError) {
          console.error(`Failed to install ${pkg} locally:`, localInstallError.message);
          process.exit(1);
        }
      }
    }
  }
}

module.exports = {
  ensurePackagesInstalled
};