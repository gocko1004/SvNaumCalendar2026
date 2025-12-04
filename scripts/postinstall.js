/**
 * Windows-compatible postinstall script
 * Runs all the fix scripts and handles errors gracefully
 */

const { execSync } = require('child_process');
const path = require('path');

function runScript(scriptPath) {
  try {
    console.log(`Running: ${scriptPath}`);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: __dirname });
    return true;
  } catch (error) {
    console.warn(`Warning: ${scriptPath} failed, continuing...`);
    return false;
  }
}

// Run fix scripts
runScript(path.join(__dirname, 'fix-expo-cli-logging.js'));
runScript(path.join(__dirname, 'fix-expo-cli-getgraphid.js'));
runScript(path.join(__dirname, 'fix-metro-terminal-reporter.js'));

// Try to run patch-package, but don't fail if it errors
try {
  console.log('Running patch-package...');
  execSync('npx patch-package', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
  console.warn('Warning: patch-package failed, but continuing...');
  console.warn('This is usually okay if patches are already applied or not needed.');
}

console.log('✅ Postinstall complete');

