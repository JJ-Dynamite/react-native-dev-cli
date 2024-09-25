const { setupReactNative } = require('../../utils/reactNativeSetup.js'); // Updated path
const { cleanupMac } = require('../../utils/macCleanup.js'); // Updated path
const { setupIOS } = require('../../utils/ios.js'); // Updated path
const { setupAndroid } = require('../../utils/android.js'); // Updated path

const setupCommand = async () => {
  console.log('Running setup command...');
  // Add your setup steps
};

module.exports = { setupCommand }; // Changed to CommonJS export