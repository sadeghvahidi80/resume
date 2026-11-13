#!/usr/bin/env bash
# VPS deployment script for sadeghvahidi.ir
# Usage: ./deploy/vps-deploy.sh [user@host] [remote_path]
# Example: ./deploy/vps-deploy.sh root@1.2.3.4 /var/www/sadeghvahidi.ir
# Requires: rsync, ssh access to the VPS

set -euo pipefail

REMOTE="${1:-root@sadeghvahidi.ir}"
REMOTE_PATH="${2:-/var/www/sadeghvahidi.ir}"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Deploying from $LOCAL_DIR to $REMOTE:$REMOTE_PATH"

# Sync all site files (exclude .git, deploy/, node_modules)
rsync -avz --delete \
  --exclude='.git' \
  --exclude='deploy' \
  --exclude='node_modules' \
  --exclude='.github' \
  --exclude='docs' \
  --exclude='*.md' \
  "$LOCAL_DIR/" "$REMOTE:$REMOTE_PATH/"

# Reload nginx
ssh "$REMOTE" "nginx -t && systemctl reload nginx"

echo "Deploy complete: https://sadeghvahidi.ir"
echo "Verify: curl -sI https://sadeghvahidi.ir/ | head -5"
