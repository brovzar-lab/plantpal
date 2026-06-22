import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './lib/store';
import { isDemoMode } from './lib/config';
import AuthScreen from './screens/AuthScreen';
import GardenScreen from './screens/GardenScreen';
import IdentifyScreen from './screens/IdentifyScreen';
import CareScheduleScreen from './screens/CareScheduleScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/BottomNav';
import DemoBanner from './components/DemoBanner';
import Toast from './components/Toast';

function AppShell() {
  return (
    <div className="flex flex-col h-full">
      {isDemoMode && <DemoBanner />}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<GardenScreen />} />
          <Route path="/identify" element={<IdentifyScreen />} />
          <Route path="/schedule" element={<CareScheduleScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
      <Toast />
    </div>
  );
}

export default function App() {
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (isDemoMode) return;
    let unsub: (() => void) | undefined;
    import('./lib/firebase').then(({ initFirebase }) => {
      unsub = initFirebase();
    });
    return () => unsub?.();
  }, []);

  return (
    <BrowserRouter>
      {user ? <AppShell /> : <AuthScreen />}
    </BrowserRouter>
  );
}
