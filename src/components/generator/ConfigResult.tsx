import React, { useRef } from 'react';
import { CheckCircle2, Download, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { copyToClipboard } from '../../utils/common';

interface ConfigResultProps {
  resultUrl: string;
  resultClash: string;
  onBack: () => void;
  onNew: () => void;
  providerName: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ConfigResult: React.FC<ConfigResultProps> = ({
  resultUrl,
  resultClash,
  onBack,
  onNew,
  providerName,
  showToast,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showToast(`${label} copied!`, 'success');
    } else {
      showToast(`Failed to copy ${label}`, 'error');
    }
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) {
      showToast('QR Code element not found', 'error');
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `QR-${providerName || 'config'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('QR Code saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to download QR Code', 'error');
    }
  };

  return (
    <div className="gento-card rounded-3xl p-6 flex flex-col flex-grow overflow-y-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5 flex-shrink-0">
        <h3 className="font-bold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Success Created
        </h3>
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white bg-white/5 px-3 py-1 rounded-lg transition-colors border border-white/5 hover:border-white/10"
        >
          Edit / Back
        </button>
      </div>

      {/* Main content */}
      <div className="space-y-4 pr-1 flex-grow">
        {/* QR Code Container */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div
            ref={qrRef}
            className="bg-white p-4 rounded-2xl flex justify-center w-max shadow-xl min-w-[160px] min-h-[160px]"
          >
            <QRCodeCanvas
              value={resultUrl}
              size={160}
              level="M"
              includeMargin={false}
            />
          </div>
          <button
            onClick={handleDownloadQr}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-2 transition-colors font-semibold"
          >
            <Download className="h-3.5 w-3.5" /> Download QR
          </button>
        </div>

        {/* V2Ray Link Box */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">V2Ray Link</span>
            <button
              onClick={() => handleCopy(resultUrl, 'V2Ray Link')}
              className="text-xs text-purple-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
          </div>
          <div className="gento-input rounded-xl p-3">
            <div className="font-mono text-[10px] text-slate-300 break-all max-h-20 overflow-y-auto">
              {resultUrl}
            </div>
          </div>
        </div>

        {/* Clash Config Box */}
        {resultClash && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Clash Config</span>
              <button
                onClick={() => handleCopy(resultClash, 'Clash Config')}
                className="text-xs text-purple-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <div className="gento-input rounded-xl p-3">
              <pre className="font-mono text-[10px] text-emerald-300 overflow-x-auto whitespace-pre max-h-32">
                <code>{resultClash}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Create New Config Button */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5 flex-shrink-0">
        <button
          onClick={onNew}
          className="col-span-2 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition-colors"
        >
          CREATE NEW
        </button>
      </div>
    </div>
  );
};
