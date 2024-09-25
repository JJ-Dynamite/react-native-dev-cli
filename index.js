const upgrade = require('./upgrade.js');
const { someFunction } = require('./upgradeFunctions.js');
const { anotherFunction } = require('./global-utils.js');
// Import other necessary functions

module.exports = {
  upgrade,
  someFunction,
  anotherFunction,
  // Export other functions as needed
};