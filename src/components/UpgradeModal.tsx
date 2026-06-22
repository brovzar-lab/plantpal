import React from 'react';
import { useStore } from '../lib/store';

export default function UpgradeModal() {
  const open = useStore((s) => s.upgradeModalOpen);
  const setOpen = useStore((s) => s.setUpgradeModalOpen);
  const showToast = useStore((s) => s.showToast);

  if (!open) return null;

  function handleUpgrade() {
    showToast('Premium coming soon — stay tuned!');
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10 space-y-5"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-5xl mb-3">🌿</div>
          <h2 className="text-xl font-extrabold text-slate-900">You've hit your plant limit</h2>
          <p className="text-sm text-slate-500 mt-1">
            Free accounts can track up to 3 plants. Upgrade to Premium for unlimited plants.
          </p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-slate-800">PlantPal Premium</p>
          {['Unlimited plants', 'AI care advice', 'Export your garden'].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-green-600">✓</span>
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-base hover:bg-green-700 transition-colors"
        >
          Upgrade to Premium
        </button>
        <button
          onClick={() => setOpen(false)}
          className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
