const fs = require('fs');
const path = require('path');

// Configuration
const TARGET_FILES = ['instantiateMetro.js', 'package.json'];
const ROOT_DIR = path.resolve(__dirname, '..');
const NODE_MODULES_DIR = path.join(ROOT_DIR, 'node_modules');

let patchCount = 0;

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                if (file !== '.bin' && !file.startsWith('.')) {
                    walkDir(filePath);
                }
            } else {
                if (TARGET_FILES.includes(file)) {
                    processFile(filePath, file);
                }
            }
        }
    } catch (e) {
        // Ignore access errors
    }
}

function processFile(filePath, fileName) {
    if (fileName === 'package.json') {
        patchPackageJson(filePath);
    } else if (fileName === 'instantiateMetro.js') {
        patchInstantiateMetro(filePath);
    }
}

function patchPackageJson(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);

        // Check if it's a metro package
        if (json.name === 'metro' || (json.name && json.name.startsWith('metro-'))) {
            if (json.exports) {
                console.log(`[Metro-Exports] Patching ${filePath}`);
                delete json.exports;
                fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
                patchCount++;
            }
        }
    } catch (e) {
        // Ignore JSON parse errors
    }
}

function patchInstantiateMetro(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const originalContent = content;

        // Fix 1: Ensure _logLines is initialized in constructor
        if (!content.includes('this._logLines = this._logLines || []')) {
            // Try multiple constructor patterns
            const constructorPatterns = [
                /(constructor\(stream\)\s*\{\s*super\(stream\);)/g,
                /(constructor\([^)]*\)\s*\{\s*super\([^)]*\);)/g,
            ];

            for (const pattern of constructorPatterns) {
                if (pattern.test(content)) {
                    content = content.replace(
                        pattern,
                        '$1\n            this._logLines = this._logLines || [];'
                    );
                    modified = true;
                    break;
                }
            }
        }

        // Fix 2: Safe _scheduleUpdate with comprehensive error handling
        if (!content.includes('if (typeof this._scheduleUpdate === \'function\')')) {
            content = content.replace(
                /(\s+)this\._scheduleUpdate\(\);/g,
                '$1if (typeof this._scheduleUpdate === \'function\') { try { this._scheduleUpdate(); } catch (e) { /* ignore */ } }'
            );
            modified = true;
        }

        // Fix 3: Critical push protection with array initialization
        if (!content.includes('if (!Array.isArray(this._logLines))')) {
            content = content.replace(
                /(\s+)this\._logLines\.push\(/g,
                '$1if (!Array.isArray(this._logLines)) this._logLines = []; this._logLines.push('
            );
            modified = true;
        }

        // Fix 4: Protect any array operations on _logLines
        if (!content.includes('/* array-safe */')) {
            // Protect map, filter, forEach operations
            content = content.replace(
                /(\s+)this\._logLines\.(map|filter|forEach|slice|join)\(/g,
                '$1/* array-safe */ (Array.isArray(this._logLines) ? this._logLines : []).$2('
            );
            if (content !== originalContent) {
                modified = true;
            }
        }

        // Fix 5: Protect length access
        content = content.replace(
            /this\._logLines\.length(?!\s*=)/g,
            '(Array.isArray(this._logLines) ? this._logLines.length : 0)'
        );
        if (content !== originalContent) {
            modified = true;
        }

        if (modified) {
            console.log(`[Expo-Logging] ✅ Patched ${filePath}`);
            fs.writeFileSync(filePath, content, 'utf8');
            patchCount++;
        }
    } catch (e) {
        console.error(`[Expo-Logging] ❌ Error patching ${filePath}:`, e.message);
    }
}

console.log('🚀 Starting recursive fix for node_modules...');
walkDir(NODE_MODULES_DIR);
console.log(`✅ Finished! Applied ${patchCount} patches.`);
