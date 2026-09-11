import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Printer, QrCode, ExternalLink } from 'lucide-react';
import { Restaurant } from '../../types';
import { api } from '../../lib/api';

interface QrModalProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ restaurant, onClose }) => {
  const [qrData, setQrData] = useState<{
    publicUrl: string;
    qrDataUrl: string;
    qrSvg: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getRestaurantQr(restaurant.id)
      .then((res) => {
        if (isMounted) {
          setQrData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching QR:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [restaurant.id]);

  const handleCopy = () => {
    if (!qrData?.publicUrl) return;
    navigator.clipboard.writeText(qrData.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!qrData?.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrData.qrDataUrl;
    link.download = `TouchBizz-QR-${restaurant.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mb-1">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">{restaurant.name}</h2>
          <p className="text-xs text-slate-400">
            QR Code permanent & Lien d'écriture pour badge NFC
          </p>
        </div>

        {/* QR Code Graphic */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner mb-6">
          {loading ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-amber-500 animate-spin" />
            </div>
          ) : qrData?.qrDataUrl ? (
            <img
              src={qrData.qrDataUrl}
              alt={`QR Code ${restaurant.name}`}
              className="w-52 h-52 object-contain"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">
              Erreur de génération
            </div>
          )}
          <p className="text-[11px] text-slate-600 font-mono mt-2 font-medium">
            TouchBizz Table Menu
          </p>
        </div>

        {/* URL Box */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            URL permanente (pour QR & Tags NFC)
          </label>
          <div className="flex items-center gap-2 p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 break-all">
            <span className="flex-1 truncate">{qrData?.publicUrl}</span>
            <a
              href={`/r/${restaurant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
              title="Ouvrir le menu"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="copy-nfc-link-button"
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Lien copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copier le lien NFC / QR</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!qrData?.qrDataUrl}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger (PNG)</span>
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-4 leading-relaxed">
          💡 <strong>Règle TouchBizz :</strong> Vous pouvez modifier vos plats, catégories, prix et thèmes à tout moment. L'URL et le QR Code resteront toujours les mêmes.
        </p>
      </div>
    </div>
  );
};
