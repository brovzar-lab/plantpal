import type { Plant, CareTask, UserProfile } from '../lib/types';

function futureDate(daysAhead: number): string {
  const d = new Date(2026, 5, 22); // anchor to today
  d.setDate(d.getDate() + daysAhead);
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
    name: 'Monstera',
    species: 'Monstera deliciosa',
    photoUrl: null,
    gradientFrom: '#16a34a',
    gradientTo: '#4ade80',
    nextWaterDays: 2,
    health: 'healthy',
    addedAt: new Date(2026, 3, 10).toISOString(),
    notes: 'Thriving near the east window.',
  },
  {
    id: 'plant-002',
    name: 'Snake Plant',
    species: 'Dracaena trifasciata',
    photoUrl: null,
    gradientFrom: '#0f766e',
    gradientTo: '#34d399',
    nextWaterDays: 5,
    health: 'healthy',
    addedAt: new Date(2026, 4, 1).toISOString(),
    notes: 'Very low maintenance — perfect for beginners.',
  },
  {
    id: 'plant-003',
    name: 'Peace Lily',
    species: 'Spathiphyllum wallisii',
    photoUrl: null,
    gradientFrom: '#7c3aed',
    gradientTo: '#a78bfa',
    nextWaterDays: 0,
    health: 'needs-attention',
    addedAt: new Date(2026, 4, 15).toISOString(),
    notes: 'Drooping slightly — needs water today.',
  },
];

export const DEMO_CARE_TASKS: CareTask[] = [
  // Today
  { id: 'task-001', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: futureDate(0), done: false },
  { id: 'task-002', plantId: 'plant-002', plantName: 'Snake Plant', type: 'mist', dueDate: futureDate(0), done: false },
  // Tomorrow
  { id: 'task-003', plantId: 'plant-001', plantName: 'Monstera', type: 'water', dueDate: futureDate(1), done: false },
  { id: 'task-004', plantId: 'plant-001', plantName: 'Monstera', type: 'fertilize', dueDate: futureDate(2), done: false },
  { id: 'task-005', plantId: 'plant-003', plantName: 'Peace Lily', type: 'fertilize', dueDate: futureDate(3), done: false },
  // Day 4
  { id: 'task-006', plantId: 'plant-002', plantName: 'Snake Plant', type: 'water', dueDate: futureDate(4), done: false },
  { id: 'task-007', plantId: 'plant-001', plantName: 'Monstera', type: 'mist', dueDate: futureDate(4), done: false },
  // Day 5-6
  { id: 'task-008', plantId: 'plant-003', plantName: 'Peace Lily', type: 'water', dueDate: futureDate(5), done: false },
  { id: 'task-009', plantId: 'plant-001', plantName: 'Monstera', type: 'repot', dueDate: futureDate(6), done: false },
  // Day 7
  { id: 'task-010', plantId: 'plant-002', plantName: 'Snake Plant', type: 'prune', dueDate: futureDate(7), done: false },
];
