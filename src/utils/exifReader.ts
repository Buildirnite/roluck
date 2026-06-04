/**
 * Lector de metadatos EXIF para JPEG, sin librería. Parsea el segmento APP1 (Exif),
 * la cabecera TIFF y los IFD relevantes (IFD0, sub-IFD Exif y GPS). Cubre los campos
 * de interés práctico (cámara, exposición, fecha, GPS); no es un parser EXIF completo.
 */

export interface ExifEntry {
  label: string;
  value: string;
}

export interface ExifResult {
  entries: ExifEntry[];
  /** Coordenadas decimales si la foto trae GPS, para enlazar a un mapa. */
  gps?: { lat: number; lon: number };
}

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

// Etiquetas legibles por tag. Se agrupan IFD0 + Exif IFD en un mismo diccionario.
const TAGS: Record<number, string> = {
  0x010e: 'Descripción',
  0x010f: 'Marca',
  0x0110: 'Modelo',
  0x0112: 'Orientación',
  0x0131: 'Software',
  0x0132: 'Fecha de modificación',
  0x013b: 'Autor',
  0x8298: 'Copyright',
  0x829a: 'Tiempo de exposición',
  0x829d: 'Apertura (f)',
  0x8827: 'ISO',
  0x9003: 'Fecha de captura',
  0x920a: 'Distancia focal',
  0x9209: 'Flash',
  0xa002: 'Ancho (px)',
  0xa003: 'Alto (px)',
  0xa434: 'Lente',
};

const ORIENTATION: Record<number, string> = {
  1: 'Normal',
  2: 'Espejo horizontal',
  3: 'Rotada 180°',
  4: 'Espejo vertical',
  5: 'Espejo + 90° CW',
  6: 'Rotada 90° CW',
  7: 'Espejo + 90° CCW',
  8: 'Rotada 90° CCW',
};

/** Lee el valor crudo de una entrada IFD como arreglo de números (o cadena ASCII). */
function readValue(
  view: DataView,
  entryOffset: number,
  tiffStart: number,
  little: boolean,
): { type: number; nums: number[]; str: string } {
  const type = view.getUint16(entryOffset + 2, little);
  const count = view.getUint32(entryOffset + 4, little);
  const size = (TYPE_SIZE[type] ?? 1) * count;
  // Si los datos caben en 4 bytes van inline; si no, el campo apunta a un offset.
  const dataOffset = size <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, little);

  if (type === 2) {
    let str = '';
    for (let i = 0; i < count; i++) {
      const c = view.getUint8(dataOffset + i);
      if (c === 0) break;
      str += String.fromCharCode(c);
    }
    return { type, nums: [], str: str.trim() };
  }

  const nums: number[] = [];
  for (let i = 0; i < count; i++) {
    const o = dataOffset + i * (TYPE_SIZE[type] ?? 1);
    switch (type) {
      case 1:
      case 7:
        nums.push(view.getUint8(o));
        break;
      case 3:
        nums.push(view.getUint16(o, little));
        break;
      case 4:
        nums.push(view.getUint32(o, little));
        break;
      case 9:
        nums.push(view.getInt32(o, little));
        break;
      case 5:
        nums.push(view.getUint32(o, little) / (view.getUint32(o + 4, little) || 1));
        break;
      case 10:
        nums.push(view.getInt32(o, little) / (view.getInt32(o + 4, little) || 1));
        break;
    }
  }
  return { type, nums, str: '' };
}

/** Recorre un IFD y ejecuta `cb` por cada entrada (tag + lector perezoso del valor). */
function eachEntry(
  view: DataView,
  ifdOffset: number,
  little: boolean,
  cb: (tag: number, entryOffset: number) => void,
): void {
  const count = view.getUint16(ifdOffset, little);
  for (let i = 0; i < count; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    cb(view.getUint16(entryOffset, little), entryOffset);
  }
}

function formatTag(tag: number, v: ReturnType<typeof readValue>): string | null {
  if (v.type === 2) return v.str || null;
  const n = v.nums[0];
  if (n === undefined) return null;
  switch (tag) {
    case 0x0112:
      return ORIENTATION[n] ?? String(n);
    case 0x829a:
      return n >= 1 ? `${n.toFixed(1)} s` : `1/${Math.round(1 / n)} s`;
    case 0x829d:
      return `ƒ/${n.toFixed(1)}`;
    case 0x920a:
      return `${n.toFixed(0)} mm`;
    case 0x9209:
      return n & 1 ? 'Disparado' : 'No disparado';
    default:
      return String(n);
  }
}

/** Convierte una coordenada GPS [grados, minutos, segundos] + referencia a decimal. */
function gpsToDecimal(dms: number[], ref: string): number {
  const dec = (dms[0] ?? 0) + (dms[1] ?? 0) / 60 + (dms[2] ?? 0) / 3600;
  return ref === 'S' || ref === 'W' ? -dec : dec;
}

export async function readExif(file: File): Promise<ExifResult> {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);

  if (view.getUint16(0) !== 0xffd8) return { entries: [] }; // no es JPEG

  // Recorrer marcadores buscando APP1 (0xFFE1) con la firma "Exif\0\0".
  let offset = 2;
  let app1 = -1;
  while (offset < view.byteLength - 1) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const len = view.getUint16(offset + 2);
    if (marker === 0xe1 && view.getUint32(offset + 4) === 0x45786966) {
      app1 = offset + 4;
      break;
    }
    if (marker === 0xda) break; // inicio de los datos de imagen
    offset += 2 + len;
  }
  if (app1 < 0) return { entries: [] };

  const tiffStart = app1 + 6; // tras "Exif\0\0"
  const little = view.getUint16(tiffStart) === 0x4949; // "II" = little-endian
  const ifd0 = tiffStart + view.getUint32(tiffStart + 4, little);

  const entries: ExifEntry[] = [];
  let exifIfd = -1;
  let gpsIfd = -1;

  eachEntry(view, ifd0, little, (tag, eo) => {
    if (tag === 0x8769) exifIfd = tiffStart + view.getUint32(eo + 8, little);
    else if (tag === 0x8825) gpsIfd = tiffStart + view.getUint32(eo + 8, little);
    else if (TAGS[tag]) {
      const out = formatTag(tag, readValue(view, eo, tiffStart, little));
      if (out) entries.push({ label: TAGS[tag], value: out });
    }
  });

  if (exifIfd > 0) {
    eachEntry(view, exifIfd, little, (tag, eo) => {
      if (TAGS[tag]) {
        const out = formatTag(tag, readValue(view, eo, tiffStart, little));
        if (out) entries.push({ label: TAGS[tag], value: out });
      }
    });
  }

  let gps: ExifResult['gps'];
  if (gpsIfd > 0) {
    let latRef = '';
    let lonRef = '';
    let lat: number[] = [];
    let lon: number[] = [];
    eachEntry(view, gpsIfd, little, (tag, eo) => {
      const v = readValue(view, eo, tiffStart, little);
      if (tag === 0x0001) latRef = v.str;
      else if (tag === 0x0002) lat = v.nums;
      else if (tag === 0x0003) lonRef = v.str;
      else if (tag === 0x0004) lon = v.nums;
    });
    if (lat.length === 3 && lon.length === 3) {
      gps = { lat: gpsToDecimal(lat, latRef), lon: gpsToDecimal(lon, lonRef) };
      entries.push({ label: 'GPS', value: `${gps.lat.toFixed(5)}, ${gps.lon.toFixed(5)}` });
    }
  }

  return { entries, gps };
}
