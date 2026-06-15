/**
 * Lógica del generador y escáner de códigos QR (/qr). 100% client-side.
 *
 * La generación usa la librería `qrcode` (PNG vía canvas y SVG) y el escaneo usa `jsqr`
 * para decodificar; ambas se importan de forma diferida (dynamic import) para que NO
 * entren al bundle base — solo se descargan cuando el usuario abre esta herramienta.
 */

/** Nivel de corrección de error: L 7%, M 15%, Q 25%, H 30%. */
export type QrLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrOptions {
  level: QrLevel;
  /** Margen (módulos en blanco) alrededor del código. */
  margin: number;
}

/** Genera el QR como data URL PNG (para previsualizar y descargar). */
export async function qrToDataUrl(text: string, opts: QrOptions): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: opts.level,
    margin: opts.margin,
    scale: 8,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
}

/** Genera el QR como cadena SVG (vectorial, función Pro). */
export async function qrToSvg(text: string, opts: QrOptions): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: opts.level,
    margin: opts.margin,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
}

/** Decodifica un QR desde los píxeles de una imagen/cuadro de video. Devuelve el texto o null. */
export async function decodeQr(data: Uint8ClampedArray, width: number, height: number): Promise<string | null> {
  const jsQR = (await import('jsqr')).default;
  const result = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  return result?.data ?? null;
}

/** Escapa los caracteres especiales del formato WIFI:/MECARD: (\ ; , : "). */
function escapeQr(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface WifiData {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

/** Construye la cadena estándar de QR de red WiFi (la leen iOS y Android). */
export function buildWifi({ ssid, password, encryption, hidden }: WifiData): string {
  const pass = encryption === 'nopass' ? '' : `P:${escapeQr(password)};`;
  return `WIFI:T:${encryption};S:${escapeQr(ssid)};${pass}${hidden ? 'H:true;' : ''};`;
}

export interface VcardData {
  name: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

/** Construye una vCard 3.0 mínima para un QR de contacto. */
export function buildVcard({ name, phone, email, org, url }: VcardData): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${name}`];
  if (org) lines.push(`ORG:${org}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  if (email) lines.push(`EMAIL:${email}`);
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

/** Indica si un texto decodificado es una URL abrible. */
export function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text.trim());
}
