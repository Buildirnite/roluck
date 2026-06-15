import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconCamera,
  IconPhotoUp,
  IconExternalLink,
  IconSparkles,
} from '@tabler/icons-react';
import ToolShell from '../components/ToolShell';
import ProBadge from '../components/ProBadge';
import { useI18n } from '../i18n/I18nContext';
import { useProStore } from '../store/useProStore';
import {
  qrToDataUrl,
  qrToSvg,
  decodeQr,
  buildWifi,
  buildVcard,
  isUrl,
  type QrLevel,
  type WifiEncryption,
} from '../utils/qr';

type Tab = 'generate' | 'scan';
type QrType = 'text' | 'url' | 'wifi' | 'vcard';

const inputClass =
  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent';
const fieldLabel = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted';

/**
 * Ruta /qr — generador y escáner de códigos QR (informe §6, Familia A). 100% client-side:
 * la generación (`qrcode`) y el escaneo (`jsqr`) se importan de forma diferida. El texto,
 * URL y el escaneo son gratis; WiFi, vCard y la exportación SVG son funciones Pro. La cámara
 * usa getUserMedia y nada sale del dispositivo.
 */
export default function QrPage() {
  const { t } = useI18n();
  const isPro = useProStore((s) => s.isPro);
  const [tab, setTab] = useState<Tab>('generate');

  return (
    <ToolShell title={t.qr.title} subtitle={t.qr.subtitle} pro>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {(['generate', 'scan'] as const).map((id) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                {id === 'generate' ? t.qr.tabGenerate : t.qr.tabScan}
              </button>
            );
          })}
        </div>

        {tab === 'generate' ? <Generate isPro={isPro} /> : <Scan />}
      </div>
    </ToolShell>
  );
}

/* ── Generar ──────────────────────────────────────────────────────────────── */

function Generate({ isPro }: { isPro: boolean }) {
  const { t } = useI18n();
  const [type, setType] = useState<QrType>('text');
  const [level, setLevel] = useState<QrLevel>('M');

  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [ssid, setSsid] = useState('');
  const [pass, setPass] = useState('');
  const [enc, setEnc] = useState<WifiEncryption>('WPA');
  const [hidden, setHidden] = useState(false);
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vOrg, setVOrg] = useState('');
  const [vUrl, setVUrl] = useState('');

  const [dataUrl, setDataUrl] = useState('');

  const proType = type === 'wifi' || type === 'vcard';
  const locked = proType && !isPro;

  const content = useMemo(() => {
    switch (type) {
      case 'text':
        return text.trim();
      case 'url':
        return url.trim();
      case 'wifi':
        return ssid ? buildWifi({ ssid, password: pass, encryption: enc, hidden }) : '';
      case 'vcard':
        return vName || vPhone || vEmail ? buildVcard({ name: vName, phone: vPhone, email: vEmail, org: vOrg, url: vUrl }) : '';
    }
  }, [type, text, url, ssid, pass, enc, hidden, vName, vPhone, vEmail, vOrg, vUrl]);

  useEffect(() => {
    if (!content || locked) {
      setDataUrl('');
      return;
    }
    let alive = true;
    qrToDataUrl(content, { level, margin: 2 })
      .then((u) => alive && setDataUrl(u))
      .catch(() => alive && setDataUrl(''));
    return () => {
      alive = false;
    };
  }, [content, level, locked]);

  function downloadPng() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'roluck-qr.png';
    a.click();
  }

  async function downloadSvg() {
    if (!content) return;
    const svg = await qrToSvg(content, { level, margin: 2 });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'roluck-qr.svg';
    a.click();
    URL.revokeObjectURL(u);
  }

  const types: { id: QrType; label: string; pro?: boolean }[] = [
    { id: 'text', label: t.qr.typeText },
    { id: 'url', label: t.qr.typeUrl },
    { id: 'wifi', label: t.qr.typeWifi, pro: true },
    { id: 'vcard', label: t.qr.typeVcard, pro: true },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        {/* Tipo */}
        <div>
          <p className={fieldLabel}>{t.qr.type}</p>
          <div className="flex flex-wrap gap-2">
            {types.map((ty) => {
              const active = ty.id === type;
              return (
                <button
                  key={ty.id}
                  type="button"
                  onClick={() => setType(ty.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border bg-bg-surface text-text-muted hover:border-accent/40 hover:text-text-primary'
                  }`}
                >
                  {ty.label}
                  {ty.pro && <IconSparkles size={12} stroke={2.2} className="text-accent" />}
                </button>
              );
            })}
          </div>
        </div>

        {locked ? (
          <ProNotice />
        ) : (
          <>
            {type === 'text' && (
              <div>
                <label className={fieldLabel}>{t.qr.typeText}</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={inputClass} />
              </div>
            )}
            {type === 'url' && (
              <div>
                <label className={fieldLabel}>{t.qr.typeUrl}</label>
                <input type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
              </div>
            )}
            {type === 'wifi' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={fieldLabel}>{t.qr.ssid}</label>
                  <input value={ssid} onChange={(e) => setSsid(e.target.value)} className={inputClass} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>{t.qr.password}</label>
                    <input value={pass} onChange={(e) => setPass(e.target.value)} disabled={enc === 'nopass'} className={`${inputClass} disabled:opacity-40`} />
                  </div>
                  <div>
                    <label className={fieldLabel}>{t.qr.encryption}</label>
                    <select value={enc} onChange={(e) => setEnc(e.target.value as WifiEncryption)} className={inputClass}>
                      <option value="WPA">{t.qr.encWpa}</option>
                      <option value="WEP">{t.qr.encWep}</option>
                      <option value="nopass">{t.qr.encNone}</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="accent-accent" />
                  {t.qr.hidden}
                </label>
              </div>
            )}
            {type === 'vcard' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={fieldLabel}>{t.qr.vName}</label>
                  <input value={vName} onChange={(e) => setVName(e.target.value)} className={inputClass} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>{t.qr.vPhone}</label>
                    <input inputMode="tel" value={vPhone} onChange={(e) => setVPhone(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldLabel}>{t.qr.vEmail}</label>
                    <input inputMode="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>{t.qr.vOrg}</label>
                    <input value={vOrg} onChange={(e) => setVOrg(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldLabel}>{t.qr.vUrl}</label>
                    <input inputMode="url" value={vUrl} onChange={(e) => setVUrl(e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Nivel de corrección */}
            <div>
              <label className={fieldLabel}>{t.qr.level}</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as QrLevel)} className={inputClass}>
                <option value="L">L · 7%</option>
                <option value="M">M · 15%</option>
                <option value="Q">Q · 25%</option>
                <option value="H">H · 30%</option>
              </select>
              <p className="mt-1 text-xs text-text-muted">{t.qr.levelHint}</p>
            </div>
          </>
        )}
      </div>

      {/* Previsualización + descargas */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl border border-border bg-white p-4">
          {dataUrl ? (
            <img src={dataUrl} alt="QR" className="h-full w-full object-contain" />
          ) : (
            <span className="px-4 text-center text-sm text-text-muted">{locked ? '' : t.qr.empty}</span>
          )}
        </div>
        {dataUrl && (
          <div className="flex w-full max-w-[280px] flex-col gap-2">
            <button
              type="button"
              onClick={downloadPng}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              <IconDownload size={17} stroke={1.8} />
              {t.qr.downloadPng}
            </button>
            {isPro ? (
              <button
                type="button"
                onClick={downloadSvg}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-accent/50"
              >
                <IconDownload size={17} stroke={1.8} />
                {t.qr.downloadSvg}
              </button>
            ) : (
              <Link
                to="/pro"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-accent/50"
              >
                {t.qr.downloadSvg}
                <ProBadge />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Aviso de función Pro con CTA a /pro (para los tipos bloqueados). */
function ProNotice() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <ProBadge />
        <span className="text-sm font-semibold text-text-primary">{t.qr.proFeature}</span>
      </div>
      <p className="text-sm text-text-muted">{t.qr.proFeatureDesc}</p>
      <Link
        to="/pro"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
      >
        <IconSparkles size={16} stroke={2} />
        {t.qr.proCta}
      </Link>
    </div>
  );
}

/* ── Escanear ─────────────────────────────────────────────────────────────── */

function Scan() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [active, setActive] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setActive(false);
  }

  // Limpieza al desmontar.
  useEffect(() => () => stop(), []);

  async function decodeFromCanvas(): Promise<string | null> {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return decodeQr(img.data, img.width, img.height);
  }

  async function startCamera() {
    setError('');
    setResult('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setActive(true);
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      let scanning = false;
      const tick = async () => {
        if (!streamRef.current) return;
        if (!scanning) {
          scanning = true;
          const found = await decodeFromCanvas();
          scanning = false;
          if (found) {
            setResult(found);
            stop();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setError(e instanceof DOMException && e.name === 'NotAllowedError' ? t.qr.cameraDenied : t.qr.cameraError);
      stop();
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setResult('');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = await decodeQr(data.data, data.width, data.height);
      if (found) setResult(found);
      else setError(t.qr.noResult);
    } catch {
      setError(t.qr.noResult);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {active ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-accent/50"
          >
            {t.qr.stopCamera}
          </button>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
          >
            <IconCamera size={17} stroke={1.8} />
            {t.qr.useCamera}
          </button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-accent/50">
          <IconPhotoUp size={17} stroke={1.8} />
          {t.qr.uploadImage}
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </label>
      </div>

      {/* Vista de cámara */}
      <div className={`relative overflow-hidden rounded-xl border border-border bg-black ${active ? 'block' : 'hidden'}`}>
        <video ref={videoRef} playsInline muted className="mx-auto max-h-[60vh] w-full object-contain" />
        {active && (
          <p className="absolute inset-x-0 bottom-0 bg-black/60 py-2 text-center text-xs text-white">{t.qr.pointCamera}</p>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t.qr.result}</p>
          <p className="break-words font-mono text-sm text-text-primary">{result}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent/50"
            >
              {copied ? <IconCheck size={16} stroke={2} className="text-accent" /> : <IconCopy size={16} stroke={1.8} />}
              {copied ? t.qr.copied : t.qr.copy}
            </button>
            {isUrl(result) && (
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-medium text-accent transition-colors hover:border-accent/50"
              >
                <IconExternalLink size={16} stroke={1.8} />
                {t.qr.openLink}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
