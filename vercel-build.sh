#!/bin/bash
set -e
echo "📦 Building application..."
npm run build
echo "✅ Build completed successfully"
ls -la dist/
echo "✅ Dist directory exists with files"
