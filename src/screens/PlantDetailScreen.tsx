import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import { DEMO_GROWTH_ENTRIES, DEMO_CARE_LOGS } from '../demo/seed';
import type { Plant, GrowthEntry, CareLogEntry, CareLogType } from '../lib/types';

const SUNLIGHT_LABEL: Record<string, string> = {
  low: 'Low light',
  medium: 'Bright indirect',
  high: 'Full sun',
};

const CARE_LOG_ICONS: Record<CareLogType, string> = {
  watered: '💧',
  fertilized: '🌿',
  repotted: '🪴',
  pruned: '✂️',
  note: '📝',
};

const CARE_LOG_LABELS: Record<CareLogType, string> = {
  watered: 'Watered',
  fertilized: 'Fertilized',
  repotted: 'Repotted',
  pruned: 'Pruned',
  note: 'Note',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type Tab = 'overview' | 'growth' | 'carelog';

export default function PlantDetailScreen() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const plants = useStore((s) => s.plants);
  const user = useStore((s) => s.user);
  const showToast = useStore((s) => s.showToast);

  const plant = plants.find((p) => p.id === plantId);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [growthEntries, setGrowthEntries] = useState<GrowthEntry[]>([]);
  const [careLogEntries, setCareLogEntries] = useState<CareLogEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Growth entry form
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [heightInput, setHeightInput] = useState('');
  const [growthNotes, setGrowthNotes] = useState('');

  // Care log form
  const [showCareForm, setShowCareForm] = useState(false);
  const [careType, setCareType] = useState<CareLogType>('watered');
  const [careNotes, setCareNotes] = useState('');

  useEffect(() => {
    if (!plantId) return;
    if (isDemoMode) {
      setGrowthEntries(DEMO_GROWTH_ENTRIES[plantId] ?? []);
      setCareLogEntries(DEMO_CARE_LOGS[plantId] ?? []);
      return;
    }
    if (!user) return;
    setLoadingDetail(true);
    Promise.all([
      import('../lib/firebase').then(({ getGrowthEntries }) => getGrowthEntries(user.uid, plantId)),
      import('../lib/firebase').then(({ getCareLogEntries }) => getCareLogEntries(user.uid, plantId)),
    ])
      .then(([growth, careLogs]) => {
        setGrowthEntries(growth);
        setCareLogEntries(careLogs);
      })
      .catch(() => showToast('Failed to load plant history'))
      .finally(() => setLoadingDetail(false));
  }, [plantId, user, showToast]);

  if (!plant) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-400 gap-2">
        <span className="text-4xl">🌿</span>
        <p className="text-sm">Plant not found</p>
        <button onClick={() => void navigate('/')} className="text-green-600 text-sm font-semibold">
          Back to garden
        </button>
      </div>
    );
  }

  async function handleAddGrowth() {
    if (!plantId) return;
    const entry: GrowthEntry = {
      id: `g-${Date.now()}`,
      heightCm: heightInput ? parseFloat(heightInput) : null,
      notes: growthNotes,
      photoUrl: null,
      loggedAt: new Date().toISOString(),
    };
    if (isDemoMode) {
      showToast('Demo mode — not saved');
      setGrowthEntries((prev) => [...prev, entry].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)));
      setShowGrowthForm(false);
      setHeightInput('');
      setGrowthNotes('');
      return;
    }
    if (!user) return;
    try {
      const { addGrowthEntry } = await import('../lib/firebase');
      const id = await addGrowthEntry(user.uid, plantId, { ...entry });
      setGrowthEntries((prev) => [...prev, { ...entry, id }].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)));
      showToast('Growth entry added!');
    } catch {
      showToast('Failed to save growth entry');
    }
    setShowGrowthForm(false);
    setHeightInput('');
    setGrowthNotes('');
  }

  async function handleAddCareLog() {
    if (!plantId) return;
    const entry: CareLogEntry = {
      id: `cl-${Date.now()}`,
      type: careType,
      notes: careNotes,
      photoUrl: null,
      loggedAt: new Date().toISOString(),
    };
    if (isDemoMode) {
      showToast('Demo mode — not saved');
      setCareLogEntries((prev) => [entry, ...prev]);
      setShowCareForm(false);
      setCareType('watered');
      setCareNotes('');
      return;
    }
    if (!user) return;
    try {
      const { addCareLogEntry } = await import('../lib/firebase');
      const id = await addCareLogEntry(user.uid, plantId, { ...entry });
      setCareLogEntries((prev) => [{ ...entry, id }, ...prev]);
      showToast('Care log added!');
    } catch {
      showToast('Failed to save care log');
    }
    setShowCareForm(false);
    setCareType('watered');
    setCareNotes('');
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'growth', label: 'Growth' },
    { key: 'carelog', label: 'Care Log' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hero */}
      <div className="relative flex-shrink-0 h-44">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${plant.gradientFrom}, ${plant.gradientTo})` }}
        >
          {plant.photoUrl && (
            <img src={plant.photoUrl} alt={plant.commonName} className="w-full h-full object-cover" />
          )}
        </div>
        <button
          onClick={() => void navigate('/')}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          aria-label="Back"
        >
          ←
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 px-4 pb-3 pt-8">
          <h1 className="text-white text-lg font-extrabold leading-tight">{plant.commonName}</h1>
          <p className="text-white/70 text-xs italic">{plant.scientificName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === t.key
                ? 'text-green-700 border-b-2 border-green-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab plant={plant} />}
        {activeTab === 'growth' && (
          <GrowthTab
            entries={growthEntries}
            loading={loadingDetail}
            onAdd={() => setShowGrowthForm(true)}
          />
        )}
        {activeTab === 'carelog' && (
          <CareLogTab
            entries={careLogEntries}
            loading={loadingDetail}
            onAdd={() => setShowCareForm(true)}
          />
        )}
      </div>

      {/* Growth entry form sheet */}
      {showGrowthForm && (
        <FormSheet title="Add Growth Entry" onClose={() => setShowGrowthForm(false)} onSubmit={handleAddGrowth}>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm)</label>
          <input
            type="number"
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            placeholder="e.g. 42"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
          <textarea
            value={growthNotes}
            onChange={(e) => setGrowthNotes(e.target.value)}
            placeholder="Observations about growth..."
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </FormSheet>
      )}

      {/* Care log form sheet */}
      {showCareForm && (
        <FormSheet title="Add Care Log" onClose={() => setShowCareForm(false)} onSubmit={handleAddCareLog}>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(CARE_LOG_LABELS) as CareLogType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCareType(t)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  careType === t
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'
                }`}
              >
                {CARE_LOG_ICONS[t]} {CARE_LOG_LABELS[t]}
              </button>
            ))}
          </div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
          <textarea
            value={careNotes}
            onChange={(e) => setCareNotes(e.target.value)}
            placeholder="Any observations..."
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </FormSheet>
      )}
    </div>
  );
}

function OverviewTab({ plant }: { plant: Plant }) {
  const waterDaysLeft = (() => {
    if (!plant.lastWateredAt) return 0;
    const next = new Date(plant.lastWateredAt).getTime() + plant.wateringFrequencyDays * 86400000;
    return Math.max(0, Math.ceil((next - Date.now()) / 86400000));
  })();

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Water every" value={`${plant.wateringFrequencyDays} days`} icon="💧" />
        <InfoCard label="Sunlight" value={SUNLIGHT_LABEL[plant.sunlight] ?? plant.sunlight} icon="☀️" />
        <InfoCard label="Soil" value={plant.soilType} icon="🪴" />
        <InfoCard
          label="Next water"
          value={waterDaysLeft === 0 ? 'Today!' : `In ${waterDaysLeft}d`}
          icon="📅"
          accent={waterDaysLeft === 0}
        />
      </div>
      {plant.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
          <p className="text-sm text-amber-900">{plant.notes}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            plant.healthStatus === 'healthy'
              ? 'bg-green-500'
              : plant.healthStatus === 'needs_attention'
                ? 'bg-yellow-400'
                : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-slate-600">
          {plant.healthStatus === 'healthy'
            ? 'Healthy'
            : plant.healthStatus === 'needs_attention'
              ? 'Needs attention'
              : 'Critical — check immediately'}
        </span>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${accent ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}
    >
      <p className="text-lg mb-0.5">{icon}</p>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${accent ? 'text-red-500' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className={`text-sm font-bold ${accent ? 'text-red-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}

function GrowthTab({
  entries,
  loading,
  onAdd,
}: {
  entries: GrowthEntry[];
  loading: boolean;
  onAdd: () => void;
}) {
  if (loading) return <LoadingState />;

  const oldest = entries[0];
  const newest = entries[entries.length - 1];
  const showComparison = entries.length >= 2 && oldest !== newest;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</p>
        <button
          onClick={onAdd}
          className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
        >
          + Add Entry
        </button>
      </div>

      {showComparison && oldest.heightCm !== null && newest.heightCm !== null && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 mb-1">{fmtDate(oldest.loggedAt)}</p>
            <p className="text-2xl font-extrabold text-slate-800">{oldest.heightCm}cm</p>
            <p className="text-xs text-slate-400">First</p>
          </div>
          <div className="text-green-600 font-bold text-lg">→</div>
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 mb-1">{fmtDate(newest.loggedAt)}</p>
            <p className="text-2xl font-extrabold text-green-700">{newest.heightCm}cm</p>
            <p className="text-xs text-slate-400">Latest</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 mb-1">Growth</p>
            <p className="text-2xl font-extrabold text-green-600">
              +{(newest.heightCm - oldest.heightCm).toFixed(0)}cm
            </p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState icon="📏" message="No growth entries yet" sub="Tap + Add Entry to track your plant's progress" />
      ) : (
        <div className="space-y-3">
          {[...entries].reverse().map((entry) => (
            <div key={entry.id} className="flex gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <div className="w-px flex-1 bg-slate-100 mt-1" />
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-400">{fmtDate(entry.loggedAt)}</p>
                  {entry.heightCm !== null && (
                    <span className="text-sm font-extrabold text-green-700">{entry.heightCm}cm</span>
                  )}
                </div>
                {entry.notes && <p className="text-sm text-slate-700">{entry.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareLogTab({
  entries,
  loading,
  onAdd,
}: {
  entries: CareLogEntry[];
  loading: boolean;
  onAdd: () => void;
}) {
  if (loading) return <LoadingState />;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{entries.length} log entr{entries.length === 1 ? 'y' : 'ies'}</p>
        <button
          onClick={onAdd}
          className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
        >
          + Add Log
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon="📋" message="No care logs yet" sub="Tap + Add Log to record care actions" />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
              <span className="text-2xl mt-0.5">{CARE_LOG_ICONS[entry.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{CARE_LOG_LABELS[entry.type]}</p>
                  <p className="text-xs text-slate-400 flex-shrink-0 ml-2">{fmtDate(entry.loggedAt)}</p>
                </div>
                {entry.notes && <p className="text-xs text-slate-500 mt-0.5">{entry.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormSheet({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl p-5 z-50 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
        <button
          onClick={onSubmit}
          className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: string; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <span className="text-4xl">{icon}</span>
      <p className="text-slate-600 font-semibold text-sm">{message}</p>
      <p className="text-slate-400 text-xs">{sub}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12 text-slate-300 text-sm">Loading...</div>
  );
}
