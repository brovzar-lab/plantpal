import type { Plant, HealthStatus } from '../lib/types';

const healthConfig: Record<HealthStatus, { dot: string; label: string }> = {
  healthy: { dot: 'bg-green-500', label: 'Healthy' },
  needs_attention: { dot: 'bg-yellow-400', label: 'Needs attention' },
  critical: { dot: 'bg-red-500', label: 'Critical' },
};

const sunlightLabel: Record<string, string> = {
  low: 'Low light',
  medium: 'Bright indirect',
  high: 'Full sun',
};

function daysUntilWater(plant: Plant): number {
  if (!plant.lastWateredAt) return 0;
  const last = new Date(plant.lastWateredAt).getTime();
  const next = last + plant.wateringFrequencyDays * 86400000;
  return Math.max(0, Math.ceil((next - Date.now()) / 86400000));
}

function WaterBadge({ days }: { days: number }) {
  const urgent = days === 0;
  const soon = days <= 2;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        urgent
          ? 'bg-red-100 text-red-700'
          : soon
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'
      }`}
    >
      💧 {urgent ? 'Water now' : days === 1 ? 'Tomorrow' : `In ${days}d`}
    </span>
  );
}

interface Props {
  plant: Plant;
  onWater?: (plant: Plant) => void | Promise<void>;
  onDelete?: (plant: Plant) => void | Promise<void>;
}

export default function PlantCard({ plant, onWater, onDelete }: Props) {
  const health = healthConfig[plant.healthStatus];
  const waterDays = daysUntilWater(plant);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
      <div
        className="h-36 w-full flex items-center justify-center text-5xl relative"
        style={{ background: `linear-gradient(135deg, ${plant.gradientFrom}, ${plant.gradientTo})` }}
      >
        {plant.photoUrl ? (
          <img src={plant.photoUrl} alt={plant.commonName} className="h-full w-full object-cover" />
        ) : (
          '🌱'
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(plant)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 text-white text-xs flex items-center justify-center hover:bg-black/50 transition-colors"
            aria-label="Delete plant"
          >
            ✕
          </button>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">{plant.commonName}</h3>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${health.dot}`} />
            {health.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 italic">{plant.scientificName}</p>
        <p className="text-xs text-slate-400">☀️ {sunlightLabel[plant.sunlight] ?? plant.sunlight}</p>
        <div className="flex items-center justify-between">
          <WaterBadge days={waterDays} />
          {onWater && (
            <button
              onClick={() => onWater(plant)}
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Mark watered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
