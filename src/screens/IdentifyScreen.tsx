import React, { useRef, useState } from 'react';
import { isDemoMode } from '../lib/config';
import { useStore } from '../lib/store';

type Step = 'idle' | 'preview' | 'analyzing' | 'result';

const DEMO_RESULT = {
  name: 'Pothos',
  species: 'Epipremnum aureum',
  confidence: 94,
  care: [
    { icon: '💧', label: 'Water every 7–10 days' },
    { icon: '☀️', label: 'Indirect bright light' },
    { icon: '🌡️', label: '60–80°F (15–27°C)' },
    { icon: '💧', label: 'Low humidity tolerant' },
  ],
  description: 'Pothos is one of the easiest houseplants to grow. It thrives in a variety of conditions and requires minimal care.',
};

export default function IdentifyScreen() {
  const showToast = useStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('preview');
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleAnalyze() {
    setStep('analyzing');
    await new Promise((r) => setTimeout(r, 1800));
    setStep('result');
  }

  function handleAddToGarden() {
    if (isDemoMode) {
      showToast('Demo mode — plant not saved');
    }
    setStep('idle');
    setPreviewUrl(null);
  }

  function handleReset() {
    setStep('idle');
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Identify Plant</h1>
        <p className="text-sm text-slate-400">Take or upload a photo to identify your plant</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {step === 'idle' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-green-200 rounded-2xl h-56 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-green-50 transition-colors"
            >
              <span className="text-5xl">📷</span>
              <p className="text-green-700 font-semibold text-sm">Tap to upload a photo</p>
              <p className="text-xs text-slate-400">JPG, PNG, HEIC supported</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-base hover:bg-green-700 transition-colors"
            >
              Take Photo
            </button>
          </div>
        )}

        {step === 'preview' && previewUrl && (
          <div className="space-y-4">
            <img src={previewUrl} alt="Plant to identify" className="w-full h-64 object-cover rounded-2xl" />
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-3.5 font-semibold hover:bg-slate-50 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={() => void handleAnalyze()}
                className="flex-1 bg-green-600 text-white rounded-2xl py-3.5 font-bold hover:bg-green-700 transition-colors"
              >
                Identify Plant
              </button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="text-5xl animate-pulse">🔍</div>
            <p className="text-slate-600 font-semibold">Analyzing your plant…</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            {previewUrl && (
              <img src={previewUrl} alt="Identified plant" className="w-full h-48 object-cover rounded-2xl" />
            )}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900">{DEMO_RESULT.name}</h2>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  {DEMO_RESULT.confidence}% match
                </span>
              </div>
              <p className="text-sm italic text-slate-400">{DEMO_RESULT.species}</p>
              <p className="text-sm text-slate-600 pt-1">{DEMO_RESULT.description}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Care Guide</p>
              <div className="space-y-2">
                {DEMO_RESULT.care.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-3.5 font-semibold hover:bg-slate-50 transition-colors"
              >
                Scan Another
              </button>
              <button
                onClick={handleAddToGarden}
                className="flex-1 bg-green-600 text-white rounded-2xl py-3.5 font-bold hover:bg-green-700 transition-colors"
              >
                Add to Garden
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
