# Actualizar la página (deploy)

El `npm run build` ya está hecho → `dist/` contiene la versión nueva.
Solo falta subirla al VPS y, si cambió la config de Nginx, recargarlo.

## 1. Subir `dist/` al servidor

Opción rápida (usa el script, que vuelve a compilar por si acaso):

```bash
REMOTE=usuario@host REMOTE_PATH=/var/www/roluck ./deploy/deploy.sh
```

O, si NO quieres recompilar y subir lo ya construido, rsync directo:

```bash
rsync -avz --delete \
  --exclude '.DS_Store' \
  dist/ usuario@host:/var/www/roluck/
```

- `--delete` borra del servidor los assets viejos con hash que ya no existen.
- Sustituye `usuario@host` y la ruta por los reales (por defecto del script:
  `deploy@roluck.app` y `/var/www/roluck`).

## 2. Nginx (solo si cambiaste `deploy/nginx.conf`)

Si **solo** subiste archivos nuevos, no hace falta tocar Nginx. Si cambiaste la
config:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 3. Verificar

- `index.html` y `sw.js` se sirven **sin caché** (ya configurado en nginx.conf),
  así que la actualización llega al instante al recargar.
- El service worker detecta la versión nueva y la activa; un refresh basta.
- Comprueba en el navegador (Ctrl+Shift+R para forzar):
  - El editor muestra las 6 herramientas activas (marca de agua, difuminar,
    anotar, escalar, redacción, reemplazar fondo).
  - DevTools → Application → Service Workers: debe aparecer la versión nueva
    como *activated*.

## Checklist

- [ ] `dist/` subido con rsync (`--delete`)
- [ ] Nginx recargado (solo si cambió la config)
- [ ] Verificado en el navegador con refresh forzado
