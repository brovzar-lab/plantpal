import { create } from 'zustand';
import type { Plant, CareTask, UserProfile, WeatherData } from './types';
import { isDemoMode } from './config';
import { DEMO_PLANTS, DEMO_CARE_TASKS, DEMO_USER, DEMO_WEATHER } from '../demo/seed';

const SOS_COUNT_KEY = 'plantpal_sos_count';

function getSosCount(): number {
  if (!isDemoMode) return 0;
  return parseInt(localStorage.getItem(SOS_COUNT_KEY) ?? '0', 10);
}

export type UpgradeContext = 'plants' | 'sos';

interface PlantPalState {
  user: UserProfile | null;
  plants: Plant[];
  careTasks: CareTask[];
  weather: WeatherData | null;
  toast: string | null;
  upgradeModalOpen: boolean;
  upgradeModalContext: UpgradeContext;
  sosUsageCount: number;

  setUser: (user: UserProfile | null) => void;
  setPlants: (plants: Plant[]) => void;
  setCareTasks: (tasks: CareTask[]) => void;
  setWeather: (weather: WeatherData | null) => void;
  markTaskDone: (taskId: string) => void;
  addPlant: (plant: Plant) => void;
  removePlant: (plantId: string) => void;
  updatePlant: (plantId: string, updates: Partial<Plant>) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  setUpgradeModalOpen: (open: boolean, context?: UpgradeContext) => void;
  incrementSosUsage: () => void;
  setUpgradedToPro: () => void;
  signOut: () => void;
}

export const useStore = create<PlantPalState>((set) => ({
  user: isDemoMode ? DEMO_USER : null,
  plants: isDemoMode ? DEMO_PLANTS : [],
  careTasks: isDemoMode ? DEMO_CARE_TASKS : [],
  weather: isDemoMode ? DEMO_WEATHER : null,
  toast: null,
  upgradeModalOpen: false,
  upgradeModalContext: 'plants',
  sosUsageCount: getSosCount(),

  setUser: (user) => set({ user }),
  setPlants: (plants) => set({ plants }),
  setCareTasks: (tasks) => set({ careTasks: tasks }),
  setWeather: (weather) => set({ weather }),
  markTaskDone: (taskId) =>
    set((s) => ({
      careTasks: s.careTasks.map((t) => (t.id === taskId ? { ...t, done: true } : t)),
    })),
  addPlant: (plant) => set((s) => ({ plants: [plant, ...s.plants] })),
  removePlant: (plantId) =>
    set((s) => ({ plants: s.plants.filter((p) => p.id !== plantId) })),
  updatePlant: (plantId, updates) =>
    set((s) => ({
      plants: s.plants.map((p) => (p.id === plantId ? { ...p, ...updates } : p)),
    })),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  setUpgradeModalOpen: (open, context = 'plants') =>
    set({ upgradeModalOpen: open, upgradeModalContext: context }),
  incrementSosUsage: () =>
    set((s) => {
      const next = s.sosUsageCount + 1;
      if (isDemoMode) localStorage.setItem(SOS_COUNT_KEY, String(next));
      return { sosUsageCount: next };
    }),
  setUpgradedToPro: () =>
    set((s) => ({
      user: s.user ? { ...s.user, isPremium: true } : null,
      upgradeModalOpen: false,
    })),
  signOut: () =>
    set({
      user: isDemoMode ? DEMO_USER : null,
      plants: isDemoMode ? DEMO_PLANTS : [],
      careTasks: isDemoMode ? DEMO_CARE_TASKS : [],
      weather: isDemoMode ? DEMO_WEATHER : null,
      sosUsageCount: getSosCount(),
    }),
}));
