import { create } from 'zustand';
import type { Plant, CareTask, UserProfile } from './types';
import { isDemoMode } from './config';
import { DEMO_PLANTS, DEMO_CARE_TASKS, DEMO_USER } from '../demo/seed';

interface PlantPalState {
  user: UserProfile | null;
  plants: Plant[];
  careTasks: CareTask[];
  toast: string | null;

  setUser: (user: UserProfile | null) => void;
  setPlants: (plants: Plant[]) => void;
  setCareTasks: (tasks: CareTask[]) => void;
  markTaskDone: (taskId: string) => void;
  addPlant: (plant: Plant) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  signOut: () => void;
}

export const useStore = create<PlantPalState>((set) => ({
  user: isDemoMode ? DEMO_USER : null,
  plants: isDemoMode ? DEMO_PLANTS : [],
  careTasks: isDemoMode ? DEMO_CARE_TASKS : [],
  toast: null,

  setUser: (user) => set({ user }),
  setPlants: (plants) => set({ plants }),
  setCareTasks: (tasks) => set({ careTasks: tasks }),
  markTaskDone: (taskId) =>
    set((s) => ({
      careTasks: s.careTasks.map((t) => (t.id === taskId ? { ...t, done: true } : t)),
    })),
  addPlant: (plant) => set((s) => ({ plants: [plant, ...s.plants] })),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
  signOut: () =>
    set({
      user: isDemoMode ? DEMO_USER : null,
      plants: isDemoMode ? DEMO_PLANTS : [],
      careTasks: isDemoMode ? DEMO_CARE_TASKS : [],
    }),
}));
