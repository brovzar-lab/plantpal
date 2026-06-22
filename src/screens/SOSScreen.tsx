import React, { useRef, useState } from 'react';
import { isDemoMode } from '../lib/config';
import { useStore } from '../lib/store';
import type { SOSDiagnosis, SOSSeverity } from '../lib/types';

const DEMO_DIAGNOSIS: SOSDiagnosis = {
  condition: 'Overwatering + Root Rot',
  category: 'overwatering',
  severity: 'medium',
  treatmentSteps: [
    'Remove the plant from its pot and inspect the roots.',
    'Trim any black, mushy, or foul-smelling roots with sterile scissors.',
    'Let the root ball air-dry for 24 hours before repotting.',
    'Repot in fresh, well-draining soil with added perlite.',
    'Water sparingly — wait until the top 2 inches of soil are completely dry.',
  ],
  preventionTips: [
    'Ensure your pot has drainage holes to prevent water from pooling.',
    'Use the finger test — poke 2 inches into soil before watering.',
    'Reduce watering frequency in winter when plant growth slows.',
  ],
  confidence: 'high',
};

const SEVERITY_STYLES: Record<SOSSeverity, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-green-100', text: 'text-green-700', label: 'Low' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
};

const CATEGORY_ICONS: Record<string, string> = {
  disease: '🦠',
  pest: '🐛',
  deficiency: '🌿',
  overwatering: '💧',
  underwatering: '🏜️',
  other: '❓',
};

async function callClaudeSOS(imageBase64: string, symptoms: string): Promise<SOSDiagnosis> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  const prompt = `You are a plant pathology expert. Analyze this photo of a sick plant and the described symptoms.

Symptoms described: "${symptoms || 'No symptoms described — diagnose from photo alone.'}"

Provide a structured JSON diagnosis. Respond with ONLY a valid JSON object with these exact fields:
{
  "condition": "name of the disease/pest/deficiency/issue",
  "category": "disease" | "pest" | "deficiency" | "overwatering" | "underwatering" | "other",
  "severity": "low" | "medium" | "high" | "critical",
  "treatmentSteps": ["step 1", "step 2", "step 3"],
  "preventionTips": ["tip 1", "tip 2"],
  "confidence": "low" | "medium" | "high"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content[0]?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]) as SOSDiagnosis;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Step = 'idle' | 'preview' | 'analyzing' | 'result';

export default function SOSScreen() {
  const user = useStore((s) => s.user);
  const sosUsageCount = useStore((s) => s.sosUsageCount);
  const incrementSosUsage = useStore((s) => s.incrementSosUsage);
  const setUpgradeModalOpen = useStore((s) => s.setUpgradeModalOpen);
  const showToast = useStore((s) => s.showToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState<SOSDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const FREE_SOS_LIMIT = 1;
  const isPro = user?.isPremium ?? false;
  const sosBlocked = !isPro && sosUsageCount >= FREE_SOS_LIMIT;

  function handleFile(file: File) {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('preview');
    setError(null);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleDiagnose() {
    if (sosBlocked) {
      setUpgradeModalOpen(true, 'sos');
      return;
    }

    setStep('analyzing');
    setError(null);

    if (isDemoMode || !selectedFile) {
      await new Promise((r) => setTimeout(r, 2000));
      setDiagnosis(DEMO_DIAGNOSIS);
      incrementSosUsage();
      setStep('result');
      if (isDemoMode) showToast('Demo mode — diagnosis not saved');
      return;
    }

    try {
      const base64 = await fileToBase64(selectedFile);
      const result = await callClaudeSOS(base64, symptoms);
      setDiagnosis(result);
      incrementSosUsage();
      setStep('result');
    } catch (err) {
      console.error('SOS diagnosis failed:', err);
      setError('Diagnosis failed. Using demo result.');
      setDiagnosis(DEMO_DIAGNOSIS);
      incrementSosUsage();
      setStep('result');
    }
  }

  function handleReset() {
    setStep('idle');
    setPreviewUrl(null);
    setSelectedFile(null);
    setSymptoms('');
    setDiagnosis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const severityStyle = diagnosis ? SEVERITY_STYLES[diagnosis.severity] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Plant SOS</h1>
        <p className="text-sm text-slate-400">
          {isPro
            ? 'Upload a photo + describe symptoms for AI diagnosis'
            : sosUsageCount === 0
              ? '1 free diagnosis included · Upgrade for unlimited'
              : 'Free diagnosis used · Upgrade for unlimited SOS'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {step === 'idle' && (
          <>
            {sosBlocked ? (
              <div className="border-2 border-dashed border-red-200 rounded-2xl h-40 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">🔒</span>
                <p className="text-slate-600 font-semibold text-sm">SOS is a Pro feature</p>
                <button
                  onClick={() => setUpgradeModalOpen(true, 'sos')}
                  className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-red-200 rounded-2xl h-44 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-red-50 transition-colors"
                >
                  <span className="text-5xl">📷</span>
                  <p className="text-red-600 font-semibold text-sm">Tap to upload photo of sick plant</p>
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
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe symptoms… (e.g. yellowing leaves, white spots, wilting)"
                  rows={3}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </>
            )}
          </>
        )}

        {step === 'preview' && previewUrl && (
          <>
            <img src={previewUrl} alt="Sick plant" className="w-full h-52 object-cover rounded-2xl" />
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe symptoms… (e.g. yellowing leaves, white spots, wilting)"
              rows={3}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-3.5 font-semibold hover:bg-slate-50 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={() => void handleDiagnose()}
                className="flex-1 bg-red-600 text-white rounded-2xl py-3.5 font-bold hover:bg-red-700 transition-colors"
              >
                Diagnose Plant
              </button>
            </div>
          </>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="text-5xl animate-pulse">🔬</div>
            <p className="text-slate-600 font-semibold">Analyzing your plant…</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'result' && diagnosis && severityStyle && (
          <div className="space-y-4">
            {previewUrl && (
              <img src={previewUrl} alt="Diagnosed plant" className="w-full h-44 object-cover rounded-2xl" />
            )}
            {error && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            {/* Diagnosis header */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{CATEGORY_ICONS[diagnosis.category] ?? '❓'}</span>
                    <h2 className="text-lg font-extrabold text-slate-900">{diagnosis.condition}</h2>
                  </div>
                  <p className="text-xs text-slate-400 capitalize">{diagnosis.category.replace('_', ' ')}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${severityStyle.bg} ${severityStyle.text}`}
                >
                  {severityStyle.label} severity
                </span>
              </div>
            </div>

            {/* Treatment steps */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Treatment Plan</p>
              <ol className="space-y-2">
                {diagnosis.treatmentSteps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Prevention tips */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Prevention Tips</p>
              <ul className="space-y-2">
                {diagnosis.preventionTips.map((tip, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="text-green-600 flex-shrink-0">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-red-600 text-white rounded-2xl py-4 font-bold text-base hover:bg-red-700 transition-colors"
            >
              Diagnose Another Plant
            </button>

            {!isPro && (
              <button
                onClick={() => setUpgradeModalOpen(true, 'sos')}
                className="w-full border border-green-300 text-green-700 rounded-2xl py-3 font-semibold text-sm hover:bg-green-50 transition-colors"
              >
                Upgrade for Unlimited SOS →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
