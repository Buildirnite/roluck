# Despliegue de RoLuck Convertidor

App estática (Vite SPA). Se construye en local y se sube `dist/` al VPS, servido por
Nginx. La analítica (Umami) corre aparte en el mismo servidor con Docker.

## 1. Configurar el entorno

Edita `.env` (en la raíz del proyecto) **antes de compilar**:

```ini
VITE_SITE_URL=https://tu-dominio.com        # sin barra final (canonical + Open Graph)
VITE_UMAMI_SRC=https://analytics.tu-dominio.com/script.js
VITE_UMAMI_WEBSITE_ID=<uuid-del-sitio-en-umami>
```

Si dejas las dos variables de Umami vacías, la analítica queda **desactivada**
(`initAnalytics()` es no-op) y el resto de la app funciona igual.

> `VITE_SITE_URL` se inyecta en `index.html` en tiempo de build (etiquetas OG/Twitter
> y `<link canonical>`). La imagen OG es `public/og-image.png` (1200×630), generable
> con `npm run gen:og`.

## 2. Build + subida

```bash
REMOTE=usuario@host REMOTE_PATH=/var/www/roluck ./deploy/deploy.sh
```

Hace `npm run build` y un `rsync --delete` de `dist/` al servidor (borra los assets
viejos con hash que ya no se usan).

## 3. Nginx

Copia `deploy/nginx.conf`, ajusta `server_name` y `root`, y actívalo:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/roluck
sudo ln -s /etc/nginx/sites-available/roluck /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Puntos clave que ya cubre el bloque:
- **SPA**: `try_files … /index.html` para que React Router maneje las rutas.
- **`sw.js` e `index.html` sin caché** → las actualizaciones llegan al instante.
- **`/assets/` con caché inmutable de 1 año** (los nombres llevan hash).
- **MIME** de `.webmanifest` (`application/manifest+json`) y `.wasm` (`application/wasm`).

## 4. SSL (Certbot)

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Añade el bloque `listen 443 ssl` y la renovación automática.

## 5. Umami (analítica auto-hospedada)

Cookieless → **no requiere banner de consentimiento**. Usa el MySQL 8 ya presente en
el servidor. Crea una base y un usuario para Umami, luego levanta el contenedor:

```bash
docker run -d --name umami --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e DATABASE_TYPE=mysql \
  -e DATABASE_URL="mysql://umami:CONTRASEÑA@host.docker.internal:3306/umami" \
  -e APP_SECRET="$(openssl rand -hex 32)" \
  ghcr.io/umami-software/umami:mysql-latest
```

Sirve Umami tras Nginx en `analytics.tu-dominio.com` (proxy_pass a `127.0.0.1:3000`,
+ Certbot). En el panel de Umami crea el sitio, copia el **Website ID** y la URL del
script a `.env` (paso 1) y recompila.

### Eventos que registra la app

Solo nombres de evento y metadatos no sensibles — **nunca** el contenido de imágenes,
bytes ni nombres de archivo:

| Evento           | Datos                         | Origen                     |
|------------------|-------------------------------|----------------------------|
| `convert`        | `{ format }`                  | Convertir/Comprimir/Resize |
| `batch_convert`  | `{ format, count }`           | Lote                       |
| `pdf_generated`  | `{ pages }`                   | A PDF                      |
| `tool_used`      | `{ tool }` (crop/filters/…)   | Editor                     |
| `ocr_used`       | —                             | Herramientas › OCR         |

El tracker se carga con `data-do-not-track="true"` (respeta DNT) y solo en producción.
