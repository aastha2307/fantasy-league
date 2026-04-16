#!/bin/sh
set -e
mkdir -p /app/public/uploads
npx prisma db push
exec npx next start -H 0.0.0.0
