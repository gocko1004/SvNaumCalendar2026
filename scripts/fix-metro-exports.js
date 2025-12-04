const fs = require('fs');
const path = require('path');

// The paths where metro usually lives
const possiblePaths = [
  path.join(__dirname, '..', 'node_modules', 'metro'),
  path.join(__dirname, '..', 'node_modules', '@expo', 'metro'),
  path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', 'metro')
];

let patchedCount = 0;

possiblePaths.forEach(metroPath => {
  const packageJsonPath = path.join(metroPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    console.log(`Checking Metro at: ${metroPath}`);
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // AGGRESSIVE FIX: Delete the exports field entirely
      // This forces Node to fallback to looking at "main" or file paths directly
      if (packageJson.exports) {
        delete packageJson.exports;

        // Save the file
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`✅ Removed 'exports' field from ${packageJsonPath}`);
        patchedCount++;
      } else {
        console.log(`ℹ️ 'exports' field already missing in ${packageJsonPath}`);
      }

    } catch (e) {
      console.error(`❌ Failed to patch ${packageJsonPath}:`, e);
    }
  }
});

if (patchedCount === 0) {
  console.log('⚠️  No Metro packages needed patching (or none found).');
} else {
  console.log(`✨ Successfully patched ${patchedCount} Metro package(s).`);
}

