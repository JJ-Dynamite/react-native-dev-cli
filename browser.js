import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { setupSentient } from './sentientSetup.js';

export async function handleAutomatedBrowsing(query) {
  console.log(`Initiating automated browsing for: ${query}`);
  
  // Validate and correct the input
  query = query.trim();
  if (query.toLowerCase() === 'open youtube') {
    query = 'Navigate to https://www.youtube.com';
  }
  
  try {
    const setupSuccessful = await setupSentient();
    if (!setupSuccessful) {
      console.error('Sentient setup failed. Unable to proceed with automated browsing.');
      return;
    }

    console.log('Please start Chrome, Brave, or Brave Beta manually with remote debugging enabled:');
    console.log('1. Close all instances of the browser you want to use.');
    console.log('2. Open a terminal/command prompt and run one of the following commands:');
    console.log('   Chrome: open -a "Google Chrome" --args --remote-debugging-port=9222');
    console.log('   Brave: open -a "Brave Browser" --args --remote-debugging-port=9222');
    console.log('   Brave Beta: open -a "Brave Browser Beta" --args --remote-debugging-port=9222');
    console.log('3. Alternatively, you can start the browser normally and then:');
    console.log('   - For Chrome: Go to chrome://inspect and click "Open dedicated DevTools for Node"');
    console.log('   - For Brave/Brave Beta: Go to brave://inspect and click "Open dedicated DevTools for Node"');

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise((resolve) => {
      rl.question('After starting the browser with remote debugging, press Enter to continue...', () => {
        rl.close();
        resolve();
      });
    });

    console.log(`Sentient is now browsing: ${query}`);
    console.log('If you encounter issues, try closing all browser instances and run this command again.');
    
    const pythonProcess = spawn('python', ['sentient_task.py', ...query.split(' ')], { stdio: 'inherit' });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Sentient browsing process completed successfully.`);
      } else {
        console.error(`Sentient browsing process exited with code ${code}`);
        console.log('If the error persists, try the following:');
        console.log('1. Close all instances of Chrome, Brave, and Brave Beta');
        console.log('2. Run the command again');
        console.log('3. If the issue continues, try manually starting the browser with:');
        console.log('   "/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta" --remote-debugging-port=9222 --guest');
        console.log('4. Check your internet connection');
        console.log('5. Verify that your OPENAI_API_KEY is correct and has sufficient credits');
        console.log('6. Ensure you have the latest version of Sentient installed:');
        console.log('   pip install --upgrade sentient');
        console.log('7. If you\'re using a virtual environment, make sure it\'s activated');
        console.log('8. Check the Python error output above for more detailed information');
      }
    });

    console.log('Sentient is running in the background. You can continue using the CLI.');
  } catch (error) {
    console.error('Error during automated browsing:', error.message);
  }
}