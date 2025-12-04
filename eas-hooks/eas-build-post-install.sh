#!/bin/bash

# This hook disables user script sandboxing in Xcode project
# Runs after npm install, before Xcode build

set -e

echo "🔧 Disabling user script sandboxing in Xcode project..."

# Wait for the ios directory to be generated
sleep 2

# Find the project.pbxproj file
PBXPROJ_FILE="ios/SvNaumKalendar.xcodeproj/project.pbxproj"

if [ -f "$PBXPROJ_FILE" ]; then
  echo "📝 Found Xcode project file: $PBXPROJ_FILE"

  # Create a backup
  cp "$PBXPROJ_FILE" "$PBXPROJ_FILE.bak"

  # Replace all instances of ENABLE_USER_SCRIPT_SANDBOXING = YES with NO
  if grep -q "ENABLE_USER_SCRIPT_SANDBOXING = YES" "$PBXPROJ_FILE"; then
    sed -i 's/ENABLE_USER_SCRIPT_SANDBOXING = YES/ENABLE_USER_SCRIPT_SANDBOXING = NO/g' "$PBXPROJ_FILE"
    echo "✅ Changed ENABLE_USER_SCRIPT_SANDBOXING from YES to NO"
  fi

  # If the setting doesn't exist at all, add it to all build configurations
  if ! grep -q "ENABLE_USER_SCRIPT_SANDBOXING" "$PBXPROJ_FILE"; then
    echo "ℹ️  ENABLE_USER_SCRIPT_SANDBOXING not found, will be set by Expo defaults"
  else
    echo "✅ ENABLE_USER_SCRIPT_SANDBOXING is present in project file"
  fi

  # Verify the change
  if grep -q "ENABLE_USER_SCRIPT_SANDBOXING = NO" "$PBXPROJ_FILE"; then
    echo "✅ Successfully disabled user script sandboxing"
  else
    echo "ℹ️  ENABLE_USER_SCRIPT_SANDBOXING = NO not found (might use Xcode default)"
  fi
else
  echo "⚠️  Warning: $PBXPROJ_FILE not found yet, will be generated during build"
fi

echo "🎯 Hook completed successfully"
