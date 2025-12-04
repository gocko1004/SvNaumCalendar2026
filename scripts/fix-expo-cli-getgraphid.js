/**
 * Fix for Expo CLI getGraphId error with Node.js 22+
 * ROOT CAUSE: @expo/metro/metro/lib/getGraphId.js tries to require "metro/private/lib/getGraphId"
 * but that path doesn't exist. The actual file is at "metro/src/lib/getGraphId"
 */

const fs = require('fs');
const path = require('path');

// Find ALL instances of @expo/metro/metro/lib/getGraphId.js
function findGetGraphIdFiles(rootDir) {
  const files = [];
  const searchPaths = [
    path.join(rootDir, 'node_modules', '@expo', 'metro', 'metro', 'lib', 'getGraphId.js'),
    path.join(rootDir, 'node_modules', 'expo', 'node_modules', '@expo', 'metro', 'metro', 'lib', 'getGraphId.js'),
  ];
  
  // Also search recursively for any other instances
  function searchRecursive(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name === '@expo') {
          const getGraphIdPath = path.join(fullPath, 'metro', 'metro', 'lib', 'getGraphId.js');
          if (fs.existsSync(getGraphIdPath)) {
            files.push(getGraphIdPath);
          }
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          // Don't recurse too deep, just check immediate @expo directories
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  for (const testPath of searchPaths) {
    if (fs.existsSync(testPath)) {
      files.push(testPath);
    }
  }
  
  return [...new Set(files)]; // Remove duplicates
}

const rootDir = path.join(__dirname, '..');
const getGraphIdFiles = findGetGraphIdFiles(rootDir);

if (getGraphIdFiles.length === 0) {
  console.log('⚠️  @expo/metro/metro/lib/getGraphId.js not found. Skipping getGraphId patch.');
  console.log('   This is okay if the file structure changed.');
  process.exit(0);
}

console.log(`Found ${getGraphIdFiles.length} instance(s) of getGraphId.js to patch`);

// The current content tries to require "metro/private/lib/getGraphId" which doesn't exist
// We need to change it to require from the actual location
// Try multiple possible paths
const possibleRequires = [
  'require("metro/src/lib/getGraphId")',
  'require("metro/lib/getGraphId")',
  'require("metro/private/lib/getGraphId")', // original (broken)
];

// Check which metro path actually exists
const metroPaths = [
  path.join(__dirname, '..', 'node_modules', 'metro', 'src', 'lib', 'getGraphId.js'),
  path.join(__dirname, '..', 'node_modules', 'metro', 'lib', 'getGraphId.js'),
];

let metroGetGraphIdPath = null;
for (const testPath of metroPaths) {
  if (fs.existsSync(testPath)) {
    // Determine the require path
    const metroNodeModules = path.join(__dirname, '..', 'node_modules', 'metro');
    const relativePath = path.relative(metroNodeModules, testPath).replace(/\\/g, '/');
    metroGetGraphIdPath = `metro/${relativePath.replace(/\.js$/, '')}`;
    break;
  }
}

// Patch each file found
for (const getGraphIdPath of getGraphIdFiles) {
  let content = fs.readFileSync(getGraphIdPath, 'utf8');
  
  // Only patch if not already patched
  if (content.includes('// GETGRAPHID_PATCHED')) {
    console.log(`✅ Already patched: ${path.relative(rootDir, getGraphIdPath)}`);
    continue;
  }
  
  // Check which metro path actually exists (relative to this getGraphId file)
  const getGraphIdDir = path.dirname(getGraphIdPath);
  // Find the root node_modules
  let nodeModulesRoot = getGraphIdDir;
  while (nodeModulesRoot && path.basename(nodeModulesRoot) !== 'node_modules') {
    nodeModulesRoot = path.dirname(nodeModulesRoot);
  }
  
  const metroPaths = [
    path.join(nodeModulesRoot, 'metro', 'src', 'lib', 'getGraphId.js'),
    path.join(path.dirname(nodeModulesRoot), 'metro', 'src', 'lib', 'getGraphId.js'),
  ];
  
  let metroGetGraphIdPath = null;
  for (const testPath of metroPaths) {
    if (fs.existsSync(testPath)) {
      // Use relative path from node_modules
      const relativePath = path.relative(nodeModulesRoot, testPath).replace(/\\/g, '/');
      metroGetGraphIdPath = relativePath.replace(/\.js$/, '');
      break;
    }
  }
  
  if (!metroGetGraphIdPath) {
    // Fallback: create a wrapper implementation
    console.log(`⚠️  Metro getGraphId source not found for ${path.relative(rootDir, getGraphIdPath)}. Creating fallback.`);
    
    const fallbackContent = `// GETGRAPHID_PATCHED: Fallback for Node.js compatibility
// The original require("metro/private/lib/getGraphId") doesn't work
// This is a reimplementation based on metro/src/lib/getGraphId.js

function getGraphId(entryFile, options, { shallow, lazy, unstable_allowRequireContext, resolverOptions }) {
  try {
    const canonicalize = require('metro-core/private/canonicalize');
    return JSON.stringify(
      {
        entryFile,
        options: {
          customResolverOptions: resolverOptions?.customResolverOptions ?? {},
          customTransformOptions: options?.customTransformOptions ?? null,
          dev: options?.dev,
          experimentalImportSupport: options?.experimentalImportSupport || false,
          minify: options?.minify,
          platform: options?.platform != null ? options.platform : null,
          type: options?.type,
          lazy,
          unstable_allowRequireContext,
          shallow,
          unstable_transformProfile: options?.unstable_transformProfile || "default",
        },
      },
      canonicalize.default || canonicalize
    );
  } catch (e) {
    // Ultimate fallback
    return JSON.stringify({ entryFile, options, shallow, lazy });
  }
}

module.exports = getGraphId;
module.exports.default = getGraphId;
`;
    
    fs.writeFileSync(getGraphIdPath, fallbackContent, 'utf8');
    console.log(`✅ Created fallback for: ${path.relative(rootDir, getGraphIdPath)}`);
  } else {
    // Replace the broken require with the correct path
    content = content.replace(
      /require\("metro\/private\/lib\/getGraphId"\)/,
      `require("${metroGetGraphIdPath}")`
    );
    
    // Add patch marker
    content = '// GETGRAPHID_PATCHED\n' + content;
    
    fs.writeFileSync(getGraphIdPath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(rootDir, getGraphIdPath)} to use: ${metroGetGraphIdPath}`);
  }
}

console.log('✅ Expo CLI getGraphId patching complete');

