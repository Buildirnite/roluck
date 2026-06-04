#!/usr/bin/env bash
# Despliegue de RoLuck Convertidor: build local + rsync de /dist al VPS.
#
# Requiere acceso SSH por clave al servidor. Ajusta las variables de abajo o
# pásalas por entorno:  REMOTE=usuario@host  REMOTE_PATH=/var/www/roluck  ./deploy/deploy.sh
set -euo pipefail

REMOTE="${REMOTE:-deploy@roluck.app}"          # ← usuario@host del VPS
REMOTE_PATH="${REMOTE_PATH:-/var/www/roluck}"  # ← raíz que sirve Nginx

cd "$(dirname "$0")/.."

echo "▸ Build de producción…"
npm run build

echo "▸ Sincronizando dist/ → ${REMOTE}:${REMOTE_PATH}"
# --delete elimina en el servidor lo que ya no está en dist (assets viejos con hash).
rsync -avz --delete \
  --exclude '.DS_Store' \
  dist/ "${REMOTE}:${REMOTE_PATH}/"

echo "✓ Listo. Si cambió la config de Nginx: sudo nginx -t && sudo systemctl reload nginx"
