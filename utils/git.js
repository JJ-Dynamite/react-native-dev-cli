import { handleGitOptions as handleGitOptionsImpl } from '../src/commands/git.js';

export async function handleGitOptions(arg) {
  await handleGitOptionsImpl(arg);
}