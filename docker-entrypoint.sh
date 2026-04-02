#!/bin/sh
set -e

# Ensure mounted volume is writable for the runtime user.
mkdir -p /app/data
chown -R nextjs:nodejs /app/data || true
if [ -f /app/data/infosec.db ]; then
	chown nextjs:nodejs /app/data/infosec.db || true
	chmod u+rw /app/data/infosec.db || true
fi

echo "🗄️ Running database migrations..."
su-exec nextjs npx prisma db push --accept-data-loss

echo "🚀 Starting InfoSec Report Server on port ${PORT:-3000}..."
exec su-exec nextjs node server.js
