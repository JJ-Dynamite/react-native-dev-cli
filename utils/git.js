import { handleGitOptions as handleGitOptionsImpl } from '../src/commands/git.js';

export async function handleGitOptions() {
  await handleGitOptionsImpl();
}