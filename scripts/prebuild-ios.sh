#!/bin/bash
# Pre-build script to ensure CocoaPods repo is available

set -e

echo "Setting up CocoaPods repository..."

# Try to add trunk repo if it doesn't exist, but don't fail if it does
pod repo add trunk https://cdn.cocoapods.org/ 2>/dev/null || echo "Repo already exists or CDN unavailable, continuing..."

# Update repo if possible
pod repo update trunk 2>/dev/null || echo "Could not update repo, using existing..."

echo "CocoaPods repository setup complete"

