import type { Plant, HealthStatus } from '../lib/types';

const healthConfig: Record<HealthStatus, { dot: string; label: string }> = {
  healthy: { dot: 'bg-green-500', label: 'Healthy' },
  'needs-attention': { dot: 'bg-yellow-400', label: 'Needs attention' },
  critical: { dot: 'bg-red-500', label: 'Critical' },
};

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
      💧 {urgent ? 'Water now' : days === 1 ? 'Water tomorrow' : `Water in ${days}d`}
    </span>
  );
}

interface Props {
  plant: Plant;
}

export default function PlantCard({ plant }: Props) {
  const health = healthConfig[plant.health];
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
      {/* Thumbnail */}
      <div
        className="h-36 w-full flex items-center justify-center text-5xl"
        style={{ background: `linear-gradient(135deg, ${plant.gradientFrom}, ${plant.gradientTo})` }}
      >
        {plant.photoUrl ? (
          <img src={plant.photoUrl} alt={plant.name} className="h-full w-full object-cover" />
        ) : (
          '🌱'
        )}
      </div>
      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">{plant.name}</h3>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${health.dot}`} />
            {health.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 italic">{plant.species}</p>
        <WaterBadge days={plant.nextWaterDays} />
      </div>
    </div>
  );
}
