import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';

const FEATURES = [
  'Unlimited plants',
  'Unlimited AI SOS diagnoses',
  'AI care advice',
  'Export your garden data',
];

export default function UpgradeModal() {
  const open = useStore((s) => s.upgradeModalOpen);
  const context = useStore((s) => s.upgradeModalContext);
  const setUpgradeModalOpen = useStore((s) => s.setUpgradeModalOpen);
  const setUpgradedToPro = useStore((s) => s.setUpgradedToPro);
  const showToast = useStore((s) => s.showToast);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const headline =
    context === 'sos'
      ? "You've used your free SOS diagnosis"
      : "You've hit your plant limit";

  const subline =
    context === 'sos'
      ? 'Free accounts get 1 SOS diagnosis. Upgrade for unlimited diagnoses and all Pro features.'
      : 'Free accounts can track up to 3 plants. Upgrade for unlimited plants and all Pro features.';

  async function handleUpgrade() {
    setLoading(true);
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 800));
      setUpgradedToPro();
      showToast('Demo upgraded to Pro — enjoy!');
      setLoading(false);
      return;
    }
    try {
      const { upgradeUserToPro } = await import('../lib/firebase');
      await upgradeUserToPro();
      setUpgradedToPro();
      showToast('Welcome to PlantPal Pro!');
    } catch {
      showToast('Upgrade failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={() => setUpgradeModalOpen(false)}
    >
      <div
        className="w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10 space-y-5"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-5xl mb-3">{context === 'sos' ? '🆘' : '🌿'}</div>
          <h2 className="text-xl font-extrabold text-slate-900">{headline}</h2>
          <p className="text-sm text-slate-500 mt-1">{subline}</p>
        </div>

        {/* Plan toggle */}
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setPlan('monthly')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              plan === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-400'
            }`}
          >
            Monthly
            <span className="block text-xs font-normal mt-0.5">$3.99/mo</span>
          </button>
          <button
            onClick={() => setPlan('yearly')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              plan === 'yearly' ? 'bg-white shadow text-slate-900' : 'text-slate-400'
            }`}
          >
            Yearly
            <span className="block text-xs font-normal mt-0.5">
              $29.99/yr{' '}
              <span className="text-green-600 font-bold">Save 37%</span>
            </span>
          </button>
        </div>

        {/* Features */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-slate-800">PlantPal Pro includes</p>
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-green-600">✓</span>
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={() => void handleUpgrade()}
          disabled={loading}
          className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-base hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Starting trial…' : 'Start 7-Day Free Trial'}
        </button>
        <p className="text-center text-xs text-slate-400">
          Then {plan === 'monthly' ? '$3.99/month' : '$29.99/year'} · Cancel anytime
        </p>
        <button
          onClick={() => setUpgradeModalOpen(false)}
          className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
