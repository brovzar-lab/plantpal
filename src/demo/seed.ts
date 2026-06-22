import type { Plant, CareTask, UserProfile, GrowthEntry, CareLogEntry, WeatherData } from '../lib/types';

function futureDate(daysAhead: number): string {
  const d = new Date(2026, 5, 22);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function pastDate(daysAgo: number): string {
  const d = new Date(2026, 5, 22);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export const DEMO_USER: UserProfile = {
  uid: 'demo-user-001',
  displayName: 'Alex Green',
  email: 'alex@demo.plantpal',
  isPremium: false,
  plantCount: 3,
  joinedAt: new Date(2026, 3, 10).toISOString(),
};

export const DEMO_PLANTS: Plant[] = [
  {
    id: 'plant-001',
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    photoUrl: null,
    gradientFrom: '#16a34a',
    gradientTo: '#4ade80',
    wateringFrequencyDays: 7,
    sunlight: 'medium',
    soilType: 'Well-draining potting mix',
    addedAt: new Date(2026, 3, 10).toISOString(),
    lastWateredAt: pastDate(5),
    healthStatus: 'healthy',
    notes: 'Thriving near the east window.',
  },
  {
    id: 'plant-002',
    commonName: 'Snake Plant',
    scientificName: 'Dracaena trifasciata',
    photoUrl: null,
    gradientFrom: '#0f766e',
    gradientTo: '#34d399',
    wateringFrequencyDays: 14,
    sunlight: 'low',
    soilType: 'Cactus or succulent mix',
    addedAt: new Date(2026, 4, 1).toISOString(),
    lastWateredAt: pastDate(9),
    healthStatus: 'healthy',
    notes: 'Very low maintenance — perfect for beginners.',
  },
  {
    id: 'plant-003',
    commonName: 'Peace Lily',
    scientificName: 'Spathiphyllum wallisii',
    photoUrl: null,
    gradientFrom: '#7c3aed',
    gradientTo: '#a78bfa',
    wateringFrequencyDays: 5,
    sunlight: 'low',
    soilType: 'Peat-based potting mix',
    addedAt: new Date(2026, 4, 15).toISOString(),
    lastWateredAt: pastDate(6),
    healthStatus: 'needs_attention',
    notes: 'Drooping slightly — needs water today.',
  },
];

export const DEMO_GROWTH_ENTRIES: Record<string, GrowthEntry[]> = {
  'plant-001': [
    { id: 'g-001-1', heightCm: 35, notes: 'Just added to garden', photoUrl: null, loggedAt: new Date(2026, 3, 10).toISOString() },
    { id: 'g-001-2', heightCm: 42, notes: 'New leaf unfolding nicely', photoUrl: null, loggedAt: new Date(2026, 4, 5).toISOString() },
    { id: 'g-001-3', heightCm: 51, notes: 'Growing fast after fertilizing', photoUrl: null, loggedAt: pastDate(15) },
  ],
  'plant-002': [
    { id: 'g-002-1', heightCm: 28, notes: 'Initial measurement', photoUrl: null, loggedAt: new Date(2026, 4, 1).toISOString() },
    { id: 'g-002-2', heightCm: 31, notes: 'Slow but steady growth', photoUrl: null, loggedAt: pastDate(10) },
  ],
  'plant-003': [
    { id: 'g-003-1', heightCm: 22, notes: 'First measurement after repotting', photoUrl: null, loggedAt: new Date(2026, 4, 15).toISOString() },
    { id: 'g-003-2', heightCm: 25, notes: 'Perked up after watering', photoUrl: null, loggedAt: pastDate(8) },
  ],
};

export const DEMO_CARE_LOGS: Record<string, CareLogEntry[]> = {
  'plant-001': [
    { id: 'cl-001-1', type: 'watered', notes: '', photoUrl: null, loggedAt: pastDate(5) },
    { id: 'cl-001-2', type: 'fertilized', notes: 'Added liquid fertilizer', photoUrl: null, loggedAt: pastDate(12) },
    { id: 'cl-001-3', type: 'watered', notes: '', photoUrl: null, loggedAt: pastDate(19) },
  ],
  'plant-002': [
    { id: 'cl-002-1', type: 'watered', notes: '', photoUrl: null, loggedAt: pastDate(9) },
    { id: 'cl-002-2', type: 'note', notes: 'Leaf tips slightly yellow — may be overwatering', photoUrl: null, loggedAt: pastDate(3) },
  ],
  'plant-003': [
    { id: 'cl-003-1', type: 'watered', notes: 'Drooping — gave extra water', photoUrl: null, loggedAt: pastDate(6) },
    { id: 'cl-003-2', type: 'repotted', notes: 'Moved to 6" pot with fresh peat mix', photoUrl: null, loggedAt: new Date(2026, 4, 15).toISOString() },
    { id: 'cl-003-3', type: 'pruned', notes: 'Removed two yellowed leaves', photoUrl: null, loggedAt: pastDate(20) },
  ],
};

export const DEMO_CARE_TASKS: CareTask[] = [
  // overdue (past due, not done)
  { id: 'task-ov-1', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: pastDate(2), done: false },
  { id: 'task-ov-2', plantId: 'plant-001', plantName: 'Monstera', type: 'mist', dueDate: pastDate(1), done: false },
  // today
  { id: 'task-001', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: futureDate(0), done: false },
  { id: 'task-002', plantId: 'plant-002', plantName: 'Snake Plant', type: 'mist', dueDate: futureDate(0), done: false },
  // upcoming
  { id: 'task-003', plantId: 'plant-001', plantName: 'Monstera', type: 'water', dueDate: futureDate(1), done: false },
  { id: 'task-004', plantId: 'plant-001', plantName: 'Monstera', type: 'fertilize', dueDate: futureDate(2), done: false },
  { id: 'task-005', plantId: 'plant-003', plantName: 'Peace Lily', type: 'fertilize', dueDate: futureDate(3), done: false },
  { id: 'task-006', plantId: 'plant-002', plantName: 'Snake Plant', type: 'water', dueDate: futureDate(4), done: false },
  { id: 'task-007', plantId: 'plant-001', plantName: 'Monstera', type: 'mist', dueDate: futureDate(4), done: false },
  { id: 'task-008', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: futureDate(5), done: false },
  { id: 'task-009', plantId: 'plant-001', plantName: 'Monstera', type: 'repot', dueDate: futureDate(6), done: false },
  { id: 'task-010', plantId: 'plant-002', plantName: 'Snake Plant', type: 'prune', dueDate: futureDate(7), done: false },
];

export const DEMO_WEATHER: WeatherData = {
  lat: 37.7749,
  lng: -122.4194,
  fetchedAt: new Date(2026, 5, 22).toISOString(),
  today: { date: '2026-06-22', weatherCode: 3, tempMaxC: 22, tempMinC: 14, precipitationMm: 0, precipProbabilityPct: 15 },
  forecast: [
    { date: '2026-06-23', weatherCode: 61, tempMaxC: 19, tempMinC: 13, precipitationMm: 1.2, precipProbabilityPct: 65 },
    { date: '2026-06-24', weatherCode: 63, tempMaxC: 17, tempMinC: 12, precipitationMm: 4.8, precipProbabilityPct: 80 },
    { date: '2026-06-25', weatherCode: 61, tempMaxC: 18, tempMinC: 13, precipitationMm: 1.4, precipProbabilityPct: 60 },
    { date: '2026-06-26', weatherCode: 2,  tempMaxC: 20, tempMinC: 13, precipitationMm: 0,   precipProbabilityPct: 20 },
    { date: '2026-06-27', weatherCode: 1,  tempMaxC: 22, tempMinC: 14, precipitationMm: 0,   precipProbabilityPct: 10 },
    { date: '2026-06-28', weatherCode: 0,  tempMaxC: 24, tempMinC: 15, precipitationMm: 0,   precipProbabilityPct: 5  },
    { date: '2026-06-29', weatherCode: 2,  tempMaxC: 23, tempMinC: 15, precipitationMm: 0.3, precipProbabilityPct: 25 },
  ],
};

export const DEMO_AI_ADJUSTMENTS: Record<string, { adjustedWateringDays: number; adjustmentReason: string }> = {
  'plant-001': {
    adjustedWateringDays: 9,
    adjustmentReason: 'Higher humidity and rain forecast this week extends watering from 7 to 9 days.',
  },
  'plant-002': {
    adjustedWateringDays: 14,
    adjustmentReason: 'Current conditions are within normal parameters — standard 14-day schedule maintained.',
  },
  'plant-003': {
    adjustedWateringDays: 6,
    adjustmentReason: 'Incoming rain over the next 3 days reduces watering need from 5 to 6 days.',
  },
};
