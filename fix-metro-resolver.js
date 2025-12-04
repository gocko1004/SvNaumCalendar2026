const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'metro-resolver', 'src', 'resolve.js');
let content = fs.readFileSync(filePath, 'utf8');

// Create a helper function at the top
const helperFunction = `
function getFileSystemLookup(context, filePath) {
  if (context.fileSystemLookup) {
    return context.fileSystemLookup(filePath);
  }
  // Fallback for Metro versions that don't have fileSystemLookup
  const fs = require('fs');
  const path = require('path');
  try {
    const basePath = context.originModulePath ? path.dirname(context.originModulePath) : (context.projectRoot || '.');
    const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(basePath, filePath);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      return { exists: false, type: null, realPath: null };
    }
    const stat = fs.statSync(fullPath);
    return {
      exists: true,
      type: stat.isFile() ? 'f' : stat.isDirectory() ? 'd' : null,
      realPath: fullPath
    };
  } catch (e) {
    return { exists: false, type: null, realPath: null };
  }
}
`;

// Add helper function after the imports
const insertPoint = content.indexOf('function resolve(context, moduleName, platform) {');
content = content.slice(0, insertPoint) + helperFunction + '\n' + content.slice(insertPoint);

// Replace all occurrences of context.fileSystemLookup(...) with getFileSystemLookup(context, ...)
content = content.replace(/context\.fileSystemLookup\(([^)]+)\)/g, 'getFileSystemLookup(context, $1)');

fs.writeFileSync(filePath, content);
console.log('✅ Patched all fileSystemLookup calls in metro-resolver!');

