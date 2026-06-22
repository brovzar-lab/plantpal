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
  adjustedWateringDays?: number;
  adjustmentReason?: string;
  lastScheduleUpdatedAt?: string;
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

export interface GrowthEntry {
  id: string;
  heightCm: number | null;
  notes: string;
  photoUrl: string | null;
  loggedAt: string;
}

export type CareLogType = 'watered' | 'fertilized' | 'repotted' | 'pruned' | 'note';

export interface CareLogEntry {
  id: string;
  type: CareLogType;
  notes: string;
  photoUrl: string | null;
  loggedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  isPremium: boolean;
  plantCount: number;
  joinedAt: string;
  lat?: number;
  lng?: number;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  precipProbabilityPct: number;
}

export interface WeatherData {
  lat: number;
  lng: number;
  fetchedAt: string;
  today: WeatherDay;
  forecast: WeatherDay[];
}

export interface PlantIdentificationResult {
  commonName: string;
  scientificName: string;
  wateringFrequencyDays: number;
  sunlight: Sunlight;
  soilType: string;
  description: string;
}

export type SOSCategory = 'disease' | 'pest' | 'deficiency' | 'overwatering' | 'underwatering' | 'other';
export type SOSSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SOSDiagnosis {
  condition: string;
  category: SOSCategory;
  severity: SOSSeverity;
  treatmentSteps: string[];
  preventionTips: string[];
  confidence: 'low' | 'medium' | 'high';
}
