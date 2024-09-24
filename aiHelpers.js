const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const Groq = require('groq-sdk');
const { spawn } = require('child_process');
const { generateDiff } = require('./diffUtils');

async function applyPatchUsingAI(filePath, patchFilePath, inquirer) {
  const originalContent = await fs.readFile(filePath, 'utf8');
  const patchContent = await fs.readFile(patchFilePath, 'utf8');

  const prompt = `
  Original file content:
  ${originalContent}

  Patch content:
  ${patchContent}

  Apply the patch to the original file content and provide ONLY the updated file content, without any additional text or explanations.
  `;

  const apiKeys = [
    { key: process.env.ANTHROPIC_API_KEY, type: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
    { key: process.env.GROQ_API_KEY, type: 'groq', model: 'llama3-8b-8192' },
    { key: process.env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/completions', model: 'gpt-4o-2024-08-06' },
    { key: process.env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com/v1/completions', model: 'deepseek/deepseek-coder' }
  ];

  for (const api of apiKeys) {
    if (!api.key) {
      console.log(`Skipping ${api.type || api.model} due to missing API key.`);
      continue;
    }

    try {
      let patchedContent;

      if (api.type === 'anthropic') {
        const anthropic = new Anthropic({ apiKey: api.key });
        const response = await anthropic.messages.create({
          model: api.model,
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });
        patchedContent = response.content[0].text;
      } else if (api.type === 'groq') {
        const groq = new Groq({ apiKey: api.key });
        const response = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: api.model,
        });
        patchedContent = response.choices[0]?.message?.content;
      } else {
        const response = await axios.post(
          api.url,
          {
            model: api.model,
            prompt: prompt,
            max_tokens: 2048,
            temperature: 0.5,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${api.key}`,
            },
          }
        );
        patchedContent = response.data.choices[0].text.trim();
      }

      if (patchedContent) {
        // Generate diff and review changes
        const diffResult = await generateDiff(originalContent, patchedContent, filePath);
        console.log('Diff generated:');
        console.log(diffResult);
        console.log('End of diff');
        console.log('Diff length:', diffResult.length);

        // Prompt user to review and confirm changes
        const { confirmChanges } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmChanges',
            message: 'Do you want to apply these changes?',
            default: true
          }
        ]);

        if (confirmChanges) {
          await fs.writeFile(filePath, patchedContent);
          console.log(`Patch applied successfully to ${filePath} using AI (${api.model}).`);
          return;
        } else {
          console.log('Changes not applied. Continuing to next API or manual edit...');
        }
      }
    } catch (error) {
      console.error(`Error applying patch to ${filePath} using ${api.model}:`, error.message);
    }
  }

  console.log('All AI attempts failed. Attempting manual edit...');
  await manualEdit(filePath, patchFilePath, inquirer);
}

// Remove the local generateDiff function

async function manualEdit(filePath, patchFile, inquirer) {
  const patchContent = await fs.readFile(patchFile, 'utf8');
  console.log('Patch content:');
  console.log(patchContent);
  
  const { edit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'edit',
      message: `Do you want to manually edit ${filePath}?`,
      default: true
    }
  ]);

  if (edit) {
    await editContent(filePath);
    console.log(`Manual edit completed for ${filePath}`);
  } else {
    console.log(`Skipped changes to ${filePath}`);
  }
}

async function editContent(filePath) {
  const editor = process.env.EDITOR || 'cursor'|| 'code' ||'micro' || 'nano';
  const child = spawn(editor, [filePath], {
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    child.on('exit', async (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
  });
}

module.exports = {
  applyPatchUsingAI
  // Remove generateDiff from exports
};