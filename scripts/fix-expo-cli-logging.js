const fs = require('fs');
const path = require('path');

const possiblePaths = [
  path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'instantiateMetro.js'),
  path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'instantiateMetro.js')
];

let fixed = false;

possiblePaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Fix 1: Ensure _logLines is initialized in constructor
      if (!content.includes('this._logLines = this._logLines || []')) {
        content = content.replace(
          /(constructor\(stream\)\s*\{\s*super\(stream\);)/g,
          '$1\n            // LOGGING_PATCH_APPLIED: Initialize _logLines\n            this._logLines = this._logLines || [];'
        );
        modified = true;
      }
      
      // Fix 2: Make _scheduleUpdate call safe
      if (!content.includes('if (this._scheduleUpdate) this._scheduleUpdate();')) {
         content = content.replace(
          /this\._scheduleUpdate\(\);/g,
          'try { if (this._scheduleUpdate) this._scheduleUpdate(); } catch (e) { /* Ignore */ }'
        );
        modified = true;
      }
      
      // Fix 3: Ensure _logLines exists before push - CRITICAL FIX
      // We check if the specific protection code is already there, if not, we apply it.
      // We use a more robust replacement that doesn't rely on the exact previous state if possible,
      // but here we target the specific failing line: this._logLines.push(...)
      if (!content.includes('if (!this._logLines) this._logLines = []; this._logLines.push(')) {
        content = content.replace(
          /this\._logLines\.push\(/g,
          'if (!this._logLines) this._logLines = []; this._logLines.push('
        );
        modified = true;
      }
      
      // Add patch marker if not present
      if (!content.includes('// EXPO_CLI_PATCHED_FIXED')) {
        content = '// EXPO_CLI_PATCHED_FIXED\n' + content;
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed logging issue in ${path.relative(path.join(__dirname, '..'), filePath)}`);
        fixed = true;
      } else {
         console.log(`✅ Logging already patched in ${path.relative(path.join(__dirname, '..'), filePath)}`);
         fixed = true;
      }
    } catch (e) {
      console.error(`❌ Failed to patch logging in ${filePath}`, e);
    }
  }
});

if (!fixed) {
  console.log('⚠️  Could not find instantiateMetro.js to patch logging. This might be okay if path structure differs.');
}
