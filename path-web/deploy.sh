#!/bin/bash
set -e
cd /tmp/path-build/path-web
git pull
echo "=== Building PATH frontend ==="
npm ci
npm run build
echo "=== Deploying standalone output ==="
rm -rf /opt/path-web
mkdir -p /opt/path-web
cp -r .next/standalone/. /opt/path-web/
cp -r .next/static /opt/path-web/.next/static
cp -r public /opt/path-web/public 2>/dev/null || true
sudo systemctl restart 