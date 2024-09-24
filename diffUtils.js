const fs = require('fs').promises;
const path = require('path');
const diff = require('diff');
const { spawn } = require('child_process');

async function generateDiff(originalContent, updatedContent, filePath) {
  const currentDir = process.cwd();
  const templatesDir = path.join(currentDir, '.upgrade-templates');
  const actualFile = path.resolve(currentDir, filePath);
  const updatedFile = path.join(templatesDir, `updated_${path.basename(filePath)}`);

  try {
    // Ensure the .upgrade-templates directory exists
    await fs.mkdir(templatesDir, { recursive: true });

    // Write the updated content to the updated_ file
    await fs.writeFile(updatedFile, updatedContent);

    console.log(`Updated file created at: ${updatedFile}`);

    // Verify that the files exist and log their stats
    const actualStats = await fs.stat(actualFile);
    const updatedStats = await fs.stat(updatedFile);
    console.log(`Actual file size: ${actualStats.size} bytes`);
    console.log(`Updated file size: ${updatedStats.size} bytes`);

    // Generate unified diff
    const patches = diff.createPatch(filePath, originalContent, updatedContent);
    console.log('Unified diff:');
    console.log(patches);

    // Try to open the files in a diff view using various editors
    const editors = [
      { name: 'cursor', args: ['--diff', actualFile, updatedFile] },
      { name: 'micro', args: ['--diff', actualFile, updatedFile]},
      { name: 'code', args: ['--diff', actualFile, updatedFile] },
      { name: 'vim', args: ['-d', actualFile, updatedFile] },
      { name: 'nvim', args: ['-d', actualFile, updatedFile] },
      { name: 'subl', args: ['-n', '--command', `sublimerge_diff {"left":"${actualFile}", "right":"${updatedFile}"}`] },
    ];

    for (const editor of editors) {
      try {
        console.log(`Attempting to open diff with ${editor.name}...`);
        const child = spawn(editor.name, editor.args, { stdio: 'inherit' });
        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Editor exited with code ${code}`));
            }
          });
          child.on('error', (error) => {
            reject(new Error(`Failed to start ${editor.name}: ${error.message}`));
          });
        });
        console.log(`Diff opened in ${editor.name}`);
        return "Diff view opened in editor.";
      } catch (error) {
        console.log(`Failed to open diff with ${editor.name}: ${error.message}`);
      }
    }

    // If no editor could open the diff, return the unified diff as a string
    return patches;

  } catch (error) {
    console.error('Error creating or processing diff:', error);
    return `Failed to create or process diff. Error: ${error.message}\n\nActual file: ${actualFile}\nUpdated file: ${updatedFile}`;
  }
}

module.exports = { generateDiff };