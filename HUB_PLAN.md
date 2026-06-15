# RoLuck Hub — Plan de trabajo

> Dirección única del proyecto. De conversor de imágenes a **hub de herramientas
> 100% client-side** en `roluck.app`. Basado en `roluck_hub_informe.pdf`.
> Cualquier decisión de alcance, orden o convención se resuelve contra este documento.

---

## 1. Visión

Un solo producto, una sola base de código, dos canales de ingreso:

- **Gratis + AdSense** — el núcleo de cada herramienta, con anuncios discretos.
- **RoLuck Pro** — compra única (~USD 5–6 / ~$5.000 CLP) que desbloquea todo:
  sin anuncios + funciones avanzadas. Se desbloquea **iniciando sesión con Google**;
  al pagar, queda Pro en cualquier dispositivo donde inicie sesión. Cobro vía **Paddle**
  o **Lemon Squeezy** (merchant of record). Detalle técnico en §5.

**Regla de oro:** Pro nunca le quita nada a lo que hoy es gratis. Se construye ENCIMA.

**Diferenciador a proteger:** *todo se procesa en tu dispositivo, tus archivos nunca
salen de tu equipo*. Debe estar visible en cada herramienta (→ `PrivacyBadge`).

---

## 2. Arquitectura

- **Stack:** React 18 + TypeScript + Vite + Tailwind. Las herramientas son 100%
  client-side (el procesamiento de archivos NUNCA sale del navegador). **Única excepción
  de backend:** el sistema Pro usa **Firebase** (Auth + Firestore + Cloud Functions) solo
  para login y verificación de pago — guarda lo mínimo (uid, email, isPro, fecha), jamás
  archivos del usuario. La promesa de privacidad de las tools queda intacta.
- **Subcarpetas, no subdominios** — toda la autoridad SEO en `roluck.app`.
- **Dos familias** dentro del mismo hub:
  - **Familia A · Archivos y utilidades** (`family: 'files'`) — universal.
  - **Familia B · Chile / pyme** (`family: 'chile'`) — calculadoras locales.
- **Fuente única de herramientas:** `src/catalog.tsx`. Añadir una tool = una entrada
  aquí (status `soon` → `live`) + su página + su SEO. De ahí derivan nav, home y sitemap.

### Mapa de rutas

```
/                 Home del hub (grilla por familia)           ✅ hecho
/pro              RoLuck Pro                                    ✅ placeholder

Familia A · Archivos y utilidades
/convertir        Conversor de imágenes                        ✅ live
/comprimir        Compresor de imágenes                        ✅ live
/editor           Editor (recortar, quitar fondo, filtros)     ✅ live
/redimensionar    Redimensionar + presets + srcset             ✅ live
/lote             Lote + ZIP                                   ✅ live
/pdf              PDF Toolbox (imágenes a PDF, unir, organizar) ✅ live
/crear            GIF, collage, spritesheet, dividir           ✅ live
/herramientas     Favicons, Base64, paleta, EXIF, OCR          ✅ live
/cotizaciones     Generador de cotizaciones/presupuestos PDF   ✅ live
/qr               Generador y escáner de QR                    ✅ live
/unidades         Conversor de unidades                        ✅ live
/tallas           Conversor de tallas                          ✅ live
/costo-viaje      Costo de viaje en auto                       ✅ live
/fechas           Calculadora de fechas / cuenta regresiva     ✅ live

Familia B · Chile / pyme
/indicadores      Conversor UF/UTM/peso/dólar                  ✅ live
/sueldo-liquido   Calculadora de sueldo líquido                ✅ live
/finiquito        Calculadora de finiquito                     ✅ live
/credito          Simulador de dividendo hipotecario           ✅ live
/dias-habiles     Plazos y días hábiles                        ✅ live
/precio-venta     Precio de venta para emprendedores           ✅ live
```

> **Estado (2026-06-14): TODAS las herramientas del roadmap están `live`** (20 live, 0 `soon`).
> Lo único pendiente de tools es *ampliar* `/pdf` a PDF Toolbox. El foco se traslada a nivel
> producto: Sistema Pro (Firebase, §5) y AdSense (Fase 1).

---

## 3. Estado: cimientos ya construidos (2026-06-14)

Primer incremento de **mejores prácticas reutilizables** — completo y con build verde:

- **`src/catalog.tsx`** — registro único (8 live + 12 soon), `liveTools`,
  `toolsByFamily()`, `tr()`. Reemplazó y eliminó `navItems.tsx`.
- **`src/pages/HomePage.tsx`** — home real en `/` (antes redirigía a `/convertir`):
  hero + grilla agrupada por familia + privacidad + CTA Pro.
- **`RailLayout`** — navegación agrupada por familia + enlace "Inicio"; consume el catálogo.
- **Primitivos:** `PrivacyBadge`, `ProBadge`, `ToolShell` (scaffold de página),
  `useProStore` (estado Pro en `localStorage` — **interino**: pasará a ser la capa de
  caché de `useProStatus` sobre Firebase, ver §5).
- **`/pro`** placeholder (`ProPage`) + `routeMeta.json` → el prerender genera `pro.html`.
- i18n: namespaces `home`, `pro`, `privacy.badge` (es + en).

---

## 4. Convenciones (obligatorias para toda tool nueva)

1. **Envolver la página en `<ToolShell title subtitle pro>`** — garantiza H1 + bajada +
   `PrivacyBadge` visible sin repetir markup.
2. **Lazy load de la página** en `App.tsx` (`lazy(() => import(...))`) — chunk propio.
3. **Mantener el peso bajo:** las calculadoras (Familia B y conversores) son matemática
   pura; NO deben importar nada del stack pesado de imagen/PDF. Vigilar el chunk baseline.
4. **PDF nuevo = `pdf-lib`** (ligero), nunca `jspdf` + `html2canvas` (≈590 KB juntos).
5. **SEO por ruta:** añadir entradas en `src/seo/routeMeta.json` (title/meta es+en) y
   `src/seo/onPageContent.json` (heading + intro[] + FAQ[]). El prerender y `useSeo` hacen
   el resto (FAQ JSON-LD incluido). Añadir la URL a `public/sitemap.xml`.
6. **Gating Pro consistente:** consultar el estado Pro compartido (`useProStatus`, ver §5;
   hoy `useProStore` como capa interina), marcar funciones bloqueadas con `<ProBadge>` /
   `<ProGate>` y enviar al CTA `/pro`. Nunca duplicar la lógica de verificación.
7. **i18n:** ES como fuente de verdad; `en` debe cumplir la misma forma (compila o falla).
   Datos con label → patrón `*_META` con `key`. Nombres de tool viven en `catalog.tsx`.
8. **Datos externos (Chile):** UF/UTM/dólar desde `mindicador.cl` con **caché en
   localStorage + fallback** y aviso si la API cae. Feriados / tramos de impuesto / topes
   = datos estáticos versionados en un config centralizado y fácil de actualizar.
9. **Disclaimer visible** en toda calculadora legal/financiera ("resultado referencial").
10. **Sin deps innecesarias** (convención del repo: pocas dependencias). Verificar con
    `npx tsc -b` y `npm run build` antes de dar por hecho.

---

## 5. Sistema Pro (infra transversal · informe §4 y §6.15)

Desbloqueo del Pro atado a una **cuenta de Google**, no a un dispositivo. Patrón familiar
para consumo (sin claves que copiar) y portable entre dispositivos. **Stack: Firebase**
(Auth + Firestore + Cloud Functions); alternativa Supabase si se prefiere Postgres.

Las 4 piezas:

1. **Login con Google** — botón "Continuar con Google" (Firebase Auth, proveedor Google).
   Entrega `uid` + `email`.
2. **Pago atado a la cuenta** — botón "Hazte Pro" abre el checkout de **Paddle / Lemon
   Squeezy** pasando el `uid` como dato personalizado (passthrough/custom data).
3. **Webhook que marca el Pro** — una **Cloud Function** recibe el webhook de pago,
   **verifica la firma** del evento, extrae el `uid` y escribe `isPro=true` en el documento
   Firestore del usuario.
4. **Gating en todo el hub** — hook `useProStatus` (lee Firestore `isPro`, cachea en
   memoria/localStorage para ser instantáneo y re-verifica) + componente `<ProGate>`. Cada
   herramienta lo usa para ocultar anuncios y habilitar funciones Pro.

**Seguridad:** las reglas de Firestore deben impedir que un usuario escriba su propio
`isPro` — solo la Cloud Function (Admin SDK) puede marcarlo. **Privacidad:** guardar lo
mínimo (uid, email, isPro, fecha). **Estados a manejar:** sesión cargando, no logueado,
pago pendiente, cierre de sesión. **Env vars:** claves de Firebase + del proveedor de pago
(documentar en `.env.example`).

> Migración desde lo hecho: `useProStore` (localStorage) se conserva como la capa de caché
> instantánea; `useProStatus` lo respalda con la verdad de Firestore.

---

## 6. Roadmap por fases

### Fase 0 — Cimientos del hub ✅ (hecho)
Catálogo, home, navegación agrupada, primitivos (PrivacyBadge/ProBadge/ToolShell/Pro store).

### Fase 1 — Ordenar la casa + primer ingreso
- [x] **Self-host de fuentes** (perf + privacidad) — `scripts/gen-fonts.cjs` (`npm run
      gen:fonts`) descarga JetBrains Mono + Space Grotesk (latin/latin-ext, 12 woff2, 268K)
      a `public/fonts/` y genera `src/styles/fonts.css` (importado en `index.css`). Quitado
      el `<link>` de Google de `index.html` + preload de las 2 críticas. sw.js v3, nginx con
      MIME woff2 + caché `/fonts/`. Build verde, sin rastro de googleapis en `dist/`.
- [ ] **Perf restante:** confirmar code-splitting estricto, revisar baseline (326 KB).
- [x] **Refactor de imagen a `ToolShell`** — las 8 páginas adoptan el scaffold (encabezado
      unificado + `PrivacyBadge` visible). 4 vía `SingleImageLayout` (ahora usa `ToolShell`
      por dentro; el botón "nueva imagen" va en `actions`), 4 directo (Lote/PDF/Crear/
      Herramientas). Editor marcado `pro`. Sin cambiar lógica. Build verde.
- [ ] **AdSense** sobre las herramientas gratuitas (Fase 0 del informe; lo activa el dueño).
- [ ] **Sistema Pro v1 (§5):** Firebase Auth + login Google + Firestore `isPro` +
      `useProStatus`/`<ProGate>` + checkout Paddle/Lemon Squeezy + Cloud Function (webhook
      con verificación de firma) + reglas de seguridad. Página `/pro` completa. Medir
      conversión gratis → Pro.

### Fase 2 — Familia A (universales), por demanda
Orden sugerido (de más liviano a más pesado):
- [x] `/unidades` — conversor de unidades (sin red). 9 categorías (incl. temperatura afín),
      lógica en `utils/units.ts`, URL `?cat&de&a`, tabla de equivalencias, SEO+FAQ. Chunk
      10 KB (3,4 KB gzip). Build verde, `unidades.html` prerenderizado.
- [x] `/fechas` — fechas, edad y cuenta regresiva (sin red). 4 pestañas (entre fechas,
      sumar/restar, edad, countdown en vivo). Lógica en `utils/dateCalc.ts`. Chunk 7,5 KB
      (2,3 KB gzip). Build verde, `fechas.html` prerenderizado.
- [x] `/tallas` — conversor de tallas US/EU/UK/CL (tablas estáticas). 7 categorías (calzado
      mujer/hombre/niños, ropa superior mujer/hombre, pantalón mujer/hombre), datos en
      `utils/sizes.ts`, URL `?cat`, equivalencias + tabla de referencia clicable + disclaimer.
      Chunk 5,8 KB. Build verde, `tallas.html` prerenderizado.
- [x] `/costo-viaje` — costo de bencina + dividir entre pasajeros. Distancia (ida o ida y
      vuelta), rendimiento en km/L o L/100km, precio por litro, peajes opcionales y división
      entre pasajeros. Lógica en `utils/tripCost.ts`. Chunk 4,4 KB. Build verde,
      `costo-viaje.html` prerenderizado.
- [x] `/qr` — generar (lib `qrcode`) + escanear (`jsqr` + getUserMedia/subir imagen). Pestañas
      Generar/Escanear. Free: texto/URL + PNG + escanear. Pro: WiFi/vCard + export SVG (logo
      pendiente). Libs cargadas con dynamic import (chunks lazy `browser` 9,6 KB gzip + `jsQR`
      47 KB gzip, FUERA del baseline). 1ª dep nueva de la fase: `qrcode`, `jsqr`, `@types/qrcode`.
      Build verde, `qr.html` prerenderizado.
- [x] `/cotizaciones` — PDF con `pdf-lib` (lazy, dynamic import), datos del emisor en
      localStorage (`useIssuerStore`). Emisor/cliente, ítems editables (cant×precio), N°/fecha/
      validez, IVA editable, moneda, notas, totales en vivo. Pro: quita la marca del pie.
      Fuentes estándar Helvetica (WinAnsi cubre acentos/ñ, sin incrustar). 1ª dep nueva:
      `pdf-lib`. Chunk QuotesPage 11 KB; pdf-lib en chunk lazy aparte (209 KB gzip, fuera del
      baseline). Build verde, `cotizaciones.html` prerenderizado.
- [x] `/pdf` — ampliado a PDF Toolbox. 3 pestañas: Imágenes a PDF (flujo original, jsPDF),
      Unir PDFs (pdf-lib, reordenar) y Organizar páginas (miniaturas pdf.js + rotar/eliminar/
      reordenar, export con pdf-lib). Lógica en `utils/pdfTools.ts` (mergePdfs/organizePdf/
      renderThumbnails/downloadPdf), componentes en `components/pdf/`. pdf-lib + pdf.js + worker
      en chunks lazy (fuera del baseline). Pendiente menor: split a múltiples archivos y
      compresión/lotes Pro. Build verde, `pdf.html` prerenderizado.

### Fase 3 — Familia B (Chile / pyme)
- [x] `/indicadores` — UF/UTM/peso/dólar/euro (mindicador.cl + caché localStorage + fallback).
      Conversor (monto + desde/hacia + intercambio) con base peso, tabla "valores de hoy",
      botón actualizar, aviso si la API cae. Lógica en `utils/indicators.ts`. 1er uso del patrón
      de datos externos (convención §8). Chunk 6,7 KB. Build verde, `indicadores.html` prerend.
- [x] `/sueldo-liquido` — descuenta AFP (10%+comisión), salud (Fonasa 7%/Isapre UF), seguro
      de cesantía e impuesto único de 2ª categoría. Config versionada centralizada en
      `utils/payroll.ts` (`PAYROLL_CONFIG`: topes en UF, tramos en UTM, comisiones AFP). UF/UTM
      del día reutilizando el util de `/indicadores`. Disclaimer prominente (convención §9).
      Chunk 6,3 KB. Build verde, `sueldo-liquido.html` prerenderizado.
- [x] `/dias-habiles` — feriados estáticos de Chile por año (`HOLIDAYS` 2025/2026 en
      `utils/businessDays.ts`). 2 pestañas: contar días hábiles/fin de semana/feriados entre
      fechas, y sumar un plazo en días hábiles a una fecha. Aviso si falta data de feriados del
      año. Reutiliza helpers de dateCalc. Chunk 5,1 KB. Build verde, `dias-habiles.html` prerend.
- [x] `/credito` — dividendo hipotecario (amortización francesa, UF↔CLP). Valor propiedad, pie %,
      tasa anual, plazo; en UF o pesos. Muestra dividendo + monto crédito + intereses + total, y
      conversión a pesos con la UF del día (reutiliza util de indicadores). Disclaimer (no incluye
      seguros). Lógica en `utils/mortgage.ts`. Chunk 4,7 KB. Build verde, `credito.html` prerend.
- [x] `/finiquito` — indemnización por años de servicio (fracción >6m = año, tope 11 años),
      aviso previo (sustitutiva si no se dio) y feriado proporcional. Tope base 90 UF con UF del
      día. Botón estimar feriado proporcional. Config versionada en `utils/severance.ts`.
      Disclaimer. Chunk 5,6 KB. Build verde, `finiquito.html` prerenderizado.
- [x] `/precio-venta` — margen/markup + IVA para pymes. Costo + modo margen/markup + % + IVA →
      precio neto, IVA, precio final, utilidad y márgenes resultantes. Matemática pura en
      `utils/sellingPrice.ts`. Chunk 4 KB. Build verde, `precio-venta.html` prerenderizado.

> **🎉 Fase 3 (Familia B) COMPLETA — y con ella TODO el roadmap de herramientas del informe.**

A medida que crece el tráfico: graduar AdSense → Ezoic → Mediavine/Raptive.

---

## 7. Notas / decisiones abiertas

- **Familia B = otro público** (no técnico: contadores, abogados, pymes). Cuidar jerarquía
  tipográfica de formularios y resultados; números grandes y legibles. No cambiar la marca,
  pero asegurar que las calculadoras se sientan claras y no "frías".
- **Pro = cuenta de Google + Firebase** (§5). Decisión tomada en esta revisión del informe:
  el login unificado con cuentas se hace desde la v1 (ya NO "licencia simple por dispositivo").
  Implica la primera dep de backend del proyecto — acotada a auth/pagos. Pendiente: elegir
  Paddle vs Lemon Squeezy y crear el proyecto Firebase.
- **PWA:** ya instalable y offline; cada tool nueva queda disponible offline automáticamente.
- **Medir antes de escalar:** tras Fase 1, la conversión gratis → Pro decide si seguir.

---

_Documento vivo. Actualizar el estado de las casillas a medida que se avanza._
