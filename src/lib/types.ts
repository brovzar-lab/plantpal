export type Sunlight = 'low' | 'medium' | 'high';
export type HealthStatus = 'healthy' | 'needs_attention' | 'critical';

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  photoUrl: string | null;
  gradientFrom: string;
  gradientTo: string;
  wateringFrequencyDays: number;
  sunlight: Sunlight;
  soilType: string;
  addedAt: string;
  lastWateredAt: string | null;
  healthStatus: HealthStatus;
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

export interface PlantIdentificationResult {
  commonName: string;
  scientificName: string;
  wateringFrequencyDays: number;
  sunlight: Sunlight;
  soilType: string;
  description: string;
}
