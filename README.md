# RoLuck Convertidor

Aplicación web para **convertir y editar imágenes directamente en el navegador**, sin
backend. Todo el procesamiento ocurre 100% del lado del cliente con la **Canvas API** y
códecs WASM — ninguna imagen se sube a ningún servidor.

> Estética *dark tech / utility tool*: fondo casi negro, acento verde lima y tipografía
> monoespaciada para los valores numéricos.

---

## ¿Qué hace?

Subes una imagen (o varias) y puedes:

- **Convertir** entre formatos: PNG, JPEG, WebP y **AVIF**.
- **Editar** antes de exportar: recortar, rotar, voltear y quitar el fondo.
- **Comprimir** ajustando la calidad o apuntando a un **peso objetivo** (ej. "máx. 500 KB").
- **Redimensionar** la salida.
- Procesar **por lotes** y descargar todo en un **ZIP**.
- Combinar varias imágenes en un **PDF** multipágina.

Privacidad por diseño: como la conversión redibuja la imagen en un canvas, **se eliminan
los metadatos EXIF** (geolocalización, datos de cámara) automáticamente.

---

## Formatos

| | Formatos |
|---|---|
| **Entrada** | PNG, JPEG, WebP, GIF, BMP, SVG, **HEIC/HEIF** (fotos de iPhone) |
| **Salida** | PNG, JPEG, WebP, **AVIF** |

> GIF y BMP se aceptan, pero la salida aplana animaciones a un solo frame.

---

## Modos de uso

La app tiene tres modos (selector arriba a la derecha):

### 1. Una imagen
Flujo de edición no destructivo en dos columnas:

- **Izquierda — controles**
  - *Editar imagen*: recortar, quitar fondo, rotar 90° (izq/der) y espejo (H/V).
  - *Exportar*: formato, calidad, peso objetivo y redimensionar.
- **Derecha — etapa visual**: muestra la imagen de trabajo en vivo (refleja cada
  edición al instante), el progreso al quitar fondo, y tras convertir el **comparador
  antes/después** con el botón de descarga.

El **original es inmutable**: cada edición se apila y se puede **deshacer** o
**revertir al original**. Las ediciones aplicadas se muestran como *badges*.

### 2. Lote + ZIP
Subes varias imágenes, defines un formato/calidad/escala común y la app las convierte
**en serie** (para no saturar la memoria en móvil), mostrando el estado de cada una.
Al terminar, descargas todo en un único `.zip`.

### 3. A PDF
Combina las imágenes en un PDF multipágina (una imagen por página, centrada y escalada).
Permite reordenar las páginas (arrastrar o flechas), elegir orientación (auto/vertical/
horizontal), tamaño (A4/Carta) y el nombre del archivo.

> Los modos *Lote* y *A PDF* comparten la misma cola de imágenes.

---

## Stack técnico

- **React 18 + TypeScript**
- **Vite** como bundler
- **Tailwind CSS v3** (sin librerías de UI externas; todos los íconos son SVG inline)
- Sin backend ni API externa

### Librerías de apoyo (todas cargadas de forma diferida / *lazy*)

| Librería | Para qué | Peso |
|---|---|---|
| `@jsquash/avif` | Codificar AVIF (WASM) | ~3.5 MB WASM |
| `heic2any` | Decodificar HEIC/HEIF | ~1.3 MB |
| `@imgly/background-removal` | Quitar fondo (modelo ML en el navegador) | ~5 MB |
| `jszip` | Empaquetar el ZIP del lote | ~30 KB gzip |
| `jspdf` | Generar el PDF | ~128 KB gzip |
| `react-image-crop` | Recorte con manijas redimensionables | liviano |

Gracias al *lazy loading*, el **bundle inicial es de ~63 KB gzip**: esas dependencias
pesadas solo se descargan cuando el usuario realmente usa AVIF, HEIC, quitar fondo, ZIP
o PDF.

---

## Arquitectura del código

```
src/
├── App.tsx                       # Raíz: estado global y los tres modos
├── main.tsx · index.css          # Entrada + estilos (Tailwind + variables de color)
├── components/
│   ├── DropZone.tsx              # Drag & drop (single y múltiple)
│   ├── ImagePreview.tsx          # Imagen + metadata
│   ├── ConversionPanel.tsx       # Formato destino + slider de calidad
│   ├── ConvertButton.tsx
│   ├── ResultCard.tsx            # Resultado, ahorro %, badge EXIF y descarga
│   ├── ComparisonSlider.tsx      # Comparador antes/después (mouse + touch)
│   ├── CropModal.tsx             # Recorte (react-image-crop)
│   ├── ResizePanel.tsx           # Redimensionar
│   ├── TransformPanel.tsx        # Rotar/voltear (modo lote, diferido)
│   ├── TransformActions.tsx      # Rotar/voltear (modo single, en vivo)
│   ├── TargetSizePanel.tsx       # Comprimir a peso objetivo
│   ├── ModeToggle.tsx            # single / batch / pdf
│   ├── BatchList.tsx             # Cola del lote con estados
│   ├── PdfPanel.tsx              # Opciones de PDF + reordenar páginas
│   └── FormatBadge.tsx
├── hooks/
│   ├── useImageConverter.ts      # Pipeline canvas + pila de edición reversible
│   ├── useBatchConverter.ts      # Conversión por lotes + ZIP
│   ├── useTargetSize.ts          # Búsqueda binaria de calidad
│   ├── usePdfExport.ts           # Generación de PDF (jsPDF)
│   └── useBackgroundRemoval.ts   # Quitar fondo (ML, lazy)
├── utils/
│   ├── canvasUtils.ts            # loadImage · renderToCanvas · canvasToBlob
│   ├── imageUtils.ts             # Formatos, bytes, nombres, ahorro
│   ├── heicDecoder.ts            # Decodificar HEIC antes del canvas
│   ├── avifEncoder.ts            # Codificar AVIF con WASM
│   ├── editUtils.ts              # Aplicar rotación/espejo como edición
│   └── cropImage.ts              # Generar el recorte
└── types/index.ts                # Tipos compartidos
```

### Pipeline de conversión (`useImageConverter`)

1. Recibe un `File` y crea una Object URL temporal.
2. Lo carga en un `Image` (decodificando HEIC primero si hace falta).
3. Lo dibuja en un `<canvas>` aplicando redimensionado / rotación / espejo.
4. Exporta con `canvas.toBlob(...)` (o el WASM de AVIF para ese formato).
5. Genera la descarga con una nueva Object URL.
6. Revoca todas las Object URLs con `URL.revokeObjectURL()` para evitar fugas de memoria.

El modelo de edición es **no destructivo**: el original queda intacto en la base de una
pila; recortar, quitar fondo y rotar/voltear apilan una "imagen de trabajo" reversible.

---

## Desarrollo

Requisitos: Node 18+.

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción → /dist
npm run preview  # previsualizar el build
```

---

## Deploy (VPS con Nginx)

```bash
npm run build
rsync -avz --delete dist/ usuario@IP_VPS:/var/www/roluck-convertidor/
```

Server block de Nginx:

```nginx
server {
    listen 80;
    server_name roluck.tudominio.cl;
    root /var/www/roluck-convertidor;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache agresivo para los assets con hash que genera Vite
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Servir los .wasm (AVIF / quitar fondo) con el MIME correcto
    types { application/wasm wasm; }
}
```

Luego activar SSL con Certbot:

```bash
sudo certbot --nginx -d roluck.tudominio.cl
```

---

## Notas

- **Siempre dark**: la app no tiene toggle de tema claro.
- **Compatibilidad AVIF**: se codifica con WASM (no con `canvas.toBlob`, que es
  inconsistente entre navegadores). En navegadores antiguos conviene usar JPEG o WebP.
- **Sin conexión tras la primera carga**: una vez cacheada, la app funciona offline,
  salvo la primera descarga del modelo de quitar fondo.
