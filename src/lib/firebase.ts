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
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useStore } from './store';
import type { UserProfile, Plant, CareTask } from './types';

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
const googleProvider = new GoogleAuthProvider();

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

async function loadPlants(uid: string): Promise<Plant[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'plants'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Plant, 'id'>) }));
}

async function loadCareTasks(uid: string): Promise<CareTask[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'careTasks'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CareTask, 'id'>) }));
}

export function initFirebase(): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      useStore.setState({ user: null, plants: [], careTasks: [] });
      return;
    }
    const [profile, plants, careTasks] = await Promise.all([
      loadProfile(fbUser),
      loadPlants(fbUser.uid),
      loadCareTasks(fbUser.uid),
    ]);
    useStore.setState({ user: profile, plants, careTasks });
  });
  return unsubscribe;
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
