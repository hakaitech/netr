#!/bin/sh
set -e

# Start the Hono API server in the background
cd /app/server
node --import tsx src/index.ts &

# Start nginx in the foreground
nginx -g "daemon off;"
