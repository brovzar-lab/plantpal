import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import PlantCard from '../components/PlantCard';
import UpgradeModal from '../components/UpgradeModal';
import type { Plant } from '../lib/types';

const FREE_LIMIT = 3;

export default function GardenScreen() {
  const user = useStore((s) => s.user);
  const plants = useStore((s) => s.plants);
  const removePlant = useStore((s) => s.removePlant);
  const updatePlant = useStore((s) => s.updatePlant);
  const showToast = useStore((s) => s.showToast);
  const setUpgradeModalOpen = useStore((s) => s.setUpgradeModalOpen);
  const navigate = useNavigate();

  async function handleWater(plant: Plant) {
    if (isDemoMode) {
      showToast('Demo mode — not saved');
      updatePlant(plant.id, { lastWateredAt: new Date().toISOString(), healthStatus: 'healthy' });
      return;
    }
    if (!user) return;
    try {
      const { markPlantWatered } = await import('../lib/firebase');
      await markPlantWatered(user.uid, plant.id);
      showToast(`${plant.commonName} marked as watered!`);
    } catch {
      showToast('Failed to update watering status');
    }
  }

  async function handleDelete(plant: Plant) {
    if (isDemoMode) {
      showToast('Demo mode — not saved');
      removePlant(plant.id);
      return;
    }
    if (!user) return;
    try {
      const { deletePlantFromFirestore } = await import('../lib/firebase');
      await deletePlantFromFirestore(user.uid, plant.id);
      showToast(`${plant.commonName} removed`);
    } catch {
      showToast('Failed to delete plant');
    }
  }

  function handleAddPlant() {
    if (!user) return;
    if (!user.isPremium && plants.length >= FREE_LIMIT) {
      setUpgradeModalOpen(true);
      return;
    }
    void navigate('/identify');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Garden</h1>
          <p className="text-sm text-slate-400">
            {plants.length} plant{plants.length !== 1 ? 's' : ''}
            {user && !user.isPremium ? ` · ${Math.max(0, FREE_LIMIT - plants.length)} free slots left` : ''}
          </p>
        </div>
        <button
          onClick={handleAddPlant}
          className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold shadow-md hover:bg-green-700 transition-colors"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <span className="text-6xl">🌱</span>
            <p className="text-slate-500 font-medium">No plants yet</p>
            <p className="text-sm text-slate-400">Identify your first plant to get started</p>
            <button
              onClick={() => void navigate('/identify')}
              className="mt-2 bg-green-600 text-white rounded-2xl px-5 py-3 font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Identify a Plant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onWater={handleWater}
                onDelete={handleDelete}
                onClick={(p) => void navigate(`/plant/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <UpgradeModal />
    </div>
  );
}
