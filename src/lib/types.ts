export type HealthStatus = 'healthy' | 'needs-attention' | 'critical';

export interface Plant {
  id: string;
  name: string;
  species: string;
  photoUrl: string | null;
  gradientFrom: string;
  gradientTo: string;
  nextWaterDays: number;
  health: HealthStatus;
  addedAt: string;
  notes: string;
}

export type CareType = 'water' | 'fertilize' | 'repot' | 'prune' | 'mist';

export interface CareTask {
  id: string;
  plantId: string;
  plantName: string;
  type: CareType;
  dueDate: string;
  done: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  isPremium: boolean;
  plantCount: number;
  joinedAt: string;
}
