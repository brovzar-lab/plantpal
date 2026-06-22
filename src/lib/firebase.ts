import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useStore } from './store';
import type { UserProfile, Plant, CareTask, PlantIdentificationResult, GrowthEntry, CareLogEntry, WeatherDay } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const functions = getFunctions(app);

const googleProvider = new GoogleAuthProvider();

const GRADIENT_PAIRS = [
  ['#16a34a', '#4ade80'],
  ['#0f766e', '#34d399'],
  ['#7c3aed', '#a78bfa'],
  ['#d97706', '#fbbf24'],
  ['#0369a1', '#38bdf8'],
  ['#be123c', '#fb7185'],
];

function plantGradient(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const pair = GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
  return [pair[0], pair[1]];
}

async function loadProfile(fbUser: User): Promise<UserProfile> {
  const ref = doc(db, 'users', fbUser.uid, 'profile', 'data');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { uid: fbUser.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
  }
  const profile: UserProfile = {
    uid: fbUser.uid,
    displayName: fbUser.displayName ?? (fbUser.email?.split('@')[0] ?? 'Plant Lover'),
    email: fbUser.email,
    isPremium: false,
    plantCount: 0,
    joinedAt: new Date().toISOString(),
  };
  await setDoc(ref, profile);
  return profile;
}

async function loadCareTasks(uid: string): Promise<CareTask[]> {
  const { getDocs } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'users', uid, 'careTasks'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CareTask, 'id'>) }));
}

function subscribeToPlants(uid: string): Unsubscribe {
  return onSnapshot(collection(db, 'users', uid, 'plants'), (snap) => {
    const plants: Plant[] = snap.docs.map((d) => {
      const raw = d.data() as Partial<Plant>;
      const { gradientFrom, gradientTo, ...rest } = raw;
      const [gFrom, gTo] = plantGradient(rest.commonName ?? d.id);
      return {
        id: d.id,
        gradientFrom: gradientFrom ?? gFrom,
        gradientTo: gradientTo ?? gTo,
        ...rest,
      } as Plant;
    });
    useStore.setState({ plants });
  });
}

export function initFirebase(): () => void {
  let plantsUnsub: Unsubscribe | undefined;

  const authUnsub = onAuthStateChanged(auth, async (fbUser) => {
    plantsUnsub?.();
    plantsUnsub = undefined;

    if (!fbUser) {
      useStore.setState({ user: null, plants: [], careTasks: [] });
      return;
    }

    const [profile, careTasks] = await Promise.all([
      loadProfile(fbUser),
      loadCareTasks(fbUser.uid),
    ]);
    useStore.setState({ user: profile, careTasks });
    plantsUnsub = subscribeToPlants(fbUser.uid);
  });

  return () => {
    authUnsub();
    plantsUnsub?.();
  };
}

export async function uploadPlantPhoto(uid: string, file: File): Promise<{ storagePath: string; downloadUrl: string }> {
  const timestamp = Date.now();
  const storagePath = `plants/${uid}/${timestamp}.jpg`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);
  return { storagePath, downloadUrl };
}

export async function identifyPlantViaFunction(storagePath: string): Promise<PlantIdentificationResult> {
  const fn = httpsCallable<{ storagePath: string }, PlantIdentificationResult>(functions, 'identifyPlant');
  const result = await fn({ storagePath });
  return result.data;
}

export interface CareScheduleRequest {
  plantId: string;
  species: string;
  wateringFrequencyDays: number;
  weather: { today: WeatherDay; forecast: WeatherDay[] };
}

export interface CareScheduleResult {
  adjustedWateringDays: number;
  adjustmentReason: string;
}

export async function generateCareScheduleViaFunction(req: CareScheduleRequest): Promise<CareScheduleResult> {
  const fn = httpsCallable<CareScheduleRequest, CareScheduleResult>(functions, 'generateCareSchedule');
  const result = await fn(req);
  return result.data;
}

export async function addPlantToFirestore(uid: string, plant: Omit<Plant, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'plants'), {
    ...plant,
    addedAt: new Date().toISOString(),
    lastWateredAt: null,
  });
  return ref.id;
}

export async function deletePlantFromFirestore(uid: string, plantId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'plants', plantId));
}

export async function markPlantWatered(uid: string, plantId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'plants', plantId), {
    lastWateredAt: new Date().toISOString(),
    healthStatus: 'healthy',
  });
}

export async function getGrowthEntries(uid: string, plantId: string): Promise<GrowthEntry[]> {
  const { getDocs, query, orderBy } = await import('firebase/firestore');
  const q = query(
    collection(db, 'users', uid, 'plants', plantId, 'growthEntries'),
    orderBy('loggedAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GrowthEntry, 'id'>) }));
}

export async function addGrowthEntry(uid: string, plantId: string, entry: Omit<GrowthEntry, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'users', uid, 'plants', plantId, 'growthEntries'), entry);
  return docRef.id;
}

export async function getCareLogEntries(uid: string, plantId: string): Promise<CareLogEntry[]> {
  const { getDocs, query, orderBy } = await import('firebase/firestore');
  const q = query(
    collection(db, 'users', uid, 'plants', plantId, 'careLog'),
    orderBy('loggedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CareLogEntry, 'id'>) }));
}

export async function addCareLogEntry(uid: string, plantId: string, entry: Omit<CareLogEntry, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'users', uid, 'plants', plantId, 'careLog'), entry);
  return docRef.id;
}

export async function signInEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpEmail(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signInGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export async function upgradeUserToPro(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const profileRef = doc(db, 'users', user.uid, 'profile', 'data');
  await updateDoc(profileRef, { isPremium: true });
  useStore.setState((s) => ({
    user: s.user ? { ...s.user, isPremium: true } : null,
  }));
}

export { serverTimestamp };
