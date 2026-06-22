import type { Plant, CareTask, UserProfile } from '../lib/types';

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

export const DEMO_CARE_TASKS: CareTask[] = [
  { id: 'task-001', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: futureDate(0), done: false },
  { id: 'task-002', plantId: 'plant-002', plantName: 'Snake Plant', type: 'mist', dueDate: futureDate(0), done: false },
  { id: 'task-003', plantId: 'plant-001', plantName: 'Monstera', type: 'water', dueDate: futureDate(1), done: false },
  { id: 'task-004', plantId: 'plant-001', plantName: 'Monstera', type: 'fertilize', dueDate: futureDate(2), done: false },
  { id: 'task-005', plantId: 'plant-003', plantName: 'Peace Lily', type: 'fertilize', dueDate: futureDate(3), done: false },
  { id: 'task-006', plantId: 'plant-002', plantName: 'Snake Plant', type: 'water', dueDate: futureDate(4), done: false },
  { id: 'task-007', plantId: 'plant-001', plantName: 'Monstera', type: 'mist', dueDate: futureDate(4), done: false },
  { id: 'task-008', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: futureDate(5), done: false },
  { id: 'task-009', plantId: 'plant-001', plantName: 'Monstera', type: 'repot', dueDate: futureDate(6), done: false },
  { id: 'task-010', plantId: 'plant-002', plantName: 'Snake Plant', type: 'prune', dueDate: futureDate(7), done: false },
];
