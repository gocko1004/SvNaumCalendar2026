const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', 'expo-modules-core', 'android', 'src', 'main', 'java', 'expo', 'modules', 'adapters', 'react', 'permissions', 'PermissionsService.kt');

if (fs.existsSync(filePath)) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Fix: requestedPermissions can be null in SDK 35
        // Original: return requestedPermissions.contains(permission)
        // Fix: return requestedPermissions?.contains(permission) == true

        if (content.includes('return requestedPermissions.contains(permission)')) {
            const newContent = content.replace(
                'return requestedPermissions.contains(permission)',
                'return requestedPermissions?.contains(permission) == true'
            );

            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log('✅ Patched PermissionsService.kt for SDK 35 compatibility');
            } else {
                console.log('ℹ️ PermissionsService.kt already patched or pattern not found');
            }
        } else {
            console.log('⚠️ Could not find exact line to patch in PermissionsService.kt');
        }
    } catch (e) {
        console.error('❌ Failed to patch PermissionsService.kt:', e);
    }
} else {
    console.log('⚠️ PermissionsService.kt not found at expected path');
}
