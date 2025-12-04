/**
 * Fix for Metro TerminalReporter export issue
 * ROOT CAUSE: metro/src/lib/TerminalReporter is not in package.json exports
 * This patches metro/package.json to add the missing export
 */

const fs = require('fs');
const path = require('path');

const metroPackageJsonPath = path.join(__dirname, '..', 'node_modules', 'metro', 'package.json');

if (!fs.existsSync(metroPackageJsonPath)) {
  console.log('⚠️  metro/package.json not found. Skipping TerminalReporter patch.');
  process.exit(0);
}

let packageJson = JSON.parse(fs.readFileSync(metroPackageJsonPath, 'utf8'));

// Only patch if not already patched
if (packageJson._terminalReporterPatched) {
  console.log('✅ metro/package.json TerminalReporter already patched');
  process.exit(0);
}

// Add export for TerminalReporter and other missing paths
if (!packageJson.exports) {
  packageJson.exports = {};
}

// Add missing exports that Expo CLI needs
const missingExports = [
  './src/lib/TerminalReporter',
  './src/lib/getGraphId',
  './src/shared/output/bundle',
  './src/lib/*',
  './src/shared/*',
];

for (const exportPath of missingExports) {
  if (!packageJson.exports[exportPath]) {
    // Convert export path to file path
    const filePath = exportPath.replace(/^\.\//, './').replace(/\*/g, '*');
    packageJson.exports[exportPath] = filePath.endsWith('/*') 
      ? filePath.replace('/*', '/*.js')
      : filePath + '.js';
  }
}

packageJson._terminalReporterPatched = true;

fs.writeFileSync(metroPackageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log('✅ Fixed metro/package.json to export TerminalReporter');

