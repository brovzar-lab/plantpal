import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import PlantCard from '../components/PlantCard';

export default function GardenScreen() {
  const plants = useStore((s) => s.plants);
  const showToast = useStore((s) => s.showToast);

  function handleAddPlant() {
    if (isDemoMode) {
      showToast('Demo mode — plant not saved');
      return;
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Garden</h1>
          <p className="text-sm text-slate-400">{plants.length} plant{plants.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleAddPlant}
          className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold shadow-md hover:bg-green-700 transition-colors"
        >
          +
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-6xl mb-4">🌱</span>
            <p className="text-slate-500 font-medium">No plants yet</p>
            <p className="text-sm text-slate-400">Tap + to add your first plant</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
