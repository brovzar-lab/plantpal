import React, { useRef, useState } from 'react';
import { isDemoMode } from '../lib/config';
import { useStore } from '../lib/store';
import type { Plant, PlantIdentificationResult, Sunlight } from '../lib/types';

const DEMO_RESULT: PlantIdentificationResult = {
  commonName: 'Pothos',
  scientificName: 'Epipremnum aureum',
  wateringFrequencyDays: 7,
  sunlight: 'medium',
  soilType: 'Well-draining potting mix',
  description:
    'Pothos is one of the easiest houseplants to grow. It thrives in a variety of conditions and requires minimal care.',
};

const GRADIENT_PAIRS = [
  ['#16a34a', '#4ade80'],
  ['#0f766e', '#34d399'],
  ['#7c3aed', '#a78bfa'],
  ['#d97706', '#fbbf24'],
  ['#0369a1', '#38bdf8'],
  ['#be123c', '#fb7185'],
];

function plantGradient(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const pair = GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
  return [pair[0], pair[1]];
}

const sunlightLabel: Record<Sunlight, string> = {
  low: 'Low light',
  medium: 'Bright indirect',
  high: 'Full sun',
};

interface ResultCardProps {
  result: PlantIdentificationResult;
  previewUrl: string | null;
  error: string | null;
  onScanAnother: () => void;
  onAddToGarden: () => void;
}

function ResultCard({ result, previewUrl, error, onScanAnother, onAddToGarden }: ResultCardProps) {
  return (
    <div className="space-y-4">
      {previewUrl && (
        <img src={previewUrl} alt="Identified plant" className="w-full h-48 object-cover rounded-2xl" />
      )}
      {error && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">{result.commonName}</h2>
          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
            AI Identified
          </span>
        </div>
        <p className="text-sm italic text-slate-400">{result.scientificName}</p>
        <p className="text-sm text-slate-600 pt-1">{result.description}</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Care Guide</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <span>💧</span>
            <span>Water every {result.wateringFrequencyDays} days</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <span>☀️</span>
            <span>{sunlightLabel[result.sunlight]}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <span>🌱</span>
            <span>{result.soilType}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onScanAnother}
          className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-3.5 font-semibold hover:bg-slate-50 transition-colors"
        >
          Scan Another
        </button>
        <button
          onClick={onAddToGarden}
          className="flex-1 bg-green-600 text-white rounded-2xl py-3.5 font-bold hover:bg-green-700 transition-colors"
        >
          Add to Garden
        </button>
      </div>
    </div>
  );
}

type Step = 'idle' | 'preview' | 'analyzing' | 'result';

export default function IdentifyScreen() {
  const user = useStore((s) => s.user);
  const plants = useStore((s) => s.plants);
  const addPlant = useStore((s) => s.addPlant);
  const showToast = useStore((s) => s.showToast);
  const setUpgradeModalOpen = useStore((s) => s.setUpgradeModalOpen);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('preview');
    setError(null);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleAnalyze() {
    setStep('analyzing');
    setError(null);

    if (isDemoMode || !user || !selectedFile) {
      await new Promise((r) => setTimeout(r, 1800));
      setResult(DEMO_RESULT);
      setStep('result');
      return;
    }

    try {
      const { uploadPlantPhoto, identifyPlantViaFunction } = await import('../lib/firebase');
      const { storagePath, downloadUrl } = await uploadPlantPhoto(user.uid, selectedFile);
      const identified = await identifyPlantViaFunction(storagePath);
      setResult({ ...identified, description: identified.description ?? '' });
      setPreviewUrl(downloadUrl);
      setStep('result');
    } catch (err) {
      console.error('Plant identification failed:', err);
      setError('Identification failed. Using demo result.');
      setResult(DEMO_RESULT);
      setStep('result');
    }
  }

  async function handleAddToGarden() {
    if (isDemoMode) {
      showToast('Demo mode — plant not saved');
      handleReset();
      return;
    }

    if (!user || !result) return;

    const FREE_LIMIT = 3;
    if (!user.isPremium && plants.length >= FREE_LIMIT) {
      setUpgradeModalOpen(true);
      return;
    }

    try {
      const { addPlantToFirestore } = await import('../lib/firebase');
      const [gFrom, gTo] = plantGradient(result.commonName);
      const newPlant: Omit<Plant, 'id'> = {
        commonName: result.commonName,
        scientificName: result.scientificName,
        photoUrl: previewUrl,
        gradientFrom: gFrom,
        gradientTo: gTo,
        wateringFrequencyDays: result.wateringFrequencyDays,
        sunlight: result.sunlight,
        soilType: result.soilType,
        addedAt: new Date().toISOString(),
        lastWateredAt: null,
        healthStatus: 'healthy',
        notes: '',
      };
      const id = await addPlantToFirestore(user.uid, newPlant);
      addPlant({ id, ...newPlant });
      showToast(`${result.commonName} added to your garden!`);
      handleReset();
    } catch {
      showToast('Failed to add plant. Please try again.');
    }
  }

  function handleReset() {
    setStep('idle');
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
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

        {step === 'result' && result && (
          <ResultCard
            result={result}
            previewUrl={previewUrl}
            error={error}
            onScanAnother={handleReset}
            onAddToGarden={() => void handleAddToGarden()}
          />
        )}
      </div>
    </div>
  );
}
