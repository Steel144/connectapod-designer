#!/bin/bash
# Quick rebuild script - use this when you make frontend changes
echo "🔨 Building frontend..."
cd /app/frontend && yarn build

echo "🔄 Restarting frontend service..."
sudo supervisorctl restart frontend

echo "✅ Done! Frontend rebuilt and restarted."
echo "💡 No need to hard refresh - the new build has unique hashed filenames"
