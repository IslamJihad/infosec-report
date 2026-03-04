#!/bin/sh
set -e

echo "🗄️ Running database migrations..."
npx prisma db push --accept-data-loss 2>&1 || echo "Migration warning (non-fatal)"

echo "🚀 Starting InfoSec Report Server on port ${PORT:-3000}..."
if [ -f ".next/standalone/server.js" ]; then
  exec node .next/standalone/server.js
else
  exec npm start
fi
