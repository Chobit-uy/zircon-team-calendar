#!/bin/bash
# Sincronizar datos de Google Sheets → Turso
# Uso: ./sync.sh
# O con URL custom: SYNC_URL=https://mi-url.vercel.app ./sync.sh

SYNC_URL="${SYNC_URL:-https://zircon-team-calendar.vercel.app}"
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
  echo "❌ Falta CRON_SECRET. Usá: CRON_SECRET=tu-secreto ./sync.sh"
  exit 1
fi

echo "🔄 Sincronizando datos..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$SYNC_URL/api/sync")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Sync exitoso:"
  echo "$BODY"
else
  echo "❌ Error HTTP $HTTP_CODE:"
  echo "$BODY"
  exit 1
fi
