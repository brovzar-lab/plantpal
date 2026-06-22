import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import { signOut } from '../lib/firebase';

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
  const plants = useStore((s) => s.plants);
  const storeSignOut = useStore((s) => s.signOut);
  const showToast = useStore((s) => s.showToast);

  async function handleSignOut() {
    if (isDemoMode) {
      showToast('Demo mode — signed out locally');
      storeSignOut();
      return;
    }
    try {
      await signOut();
      storeSignOut();
    } catch {
      showToast('Error signing out');
    }
  }

  if (!user) return null;

  const joinedDate = new Date(user.joinedAt);
  const joinedStr = joinedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
        {/* Avatar + info */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-2xl text-white font-bold flex-shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-base truncate">{user.displayName}</p>
            <p className="text-sm text-slate-500 truncate">{user.email ?? 'No email'}</p>
            <p className="text-xs text-slate-400 mt-0.5">Member since {joinedStr}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-green-600">{plants.length}</p>
            <p className="text-xs text-slate-500 mt-1">Plants</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-green-600">{user.isPremium ? '⭐' : '0'}</p>
            <p className="text-xs text-slate-500 mt-1">{user.isPremium ? 'Premium' : 'Free Plan'}</p>
          </div>
        </div>

        {/* Subscription */}
        {!user.isPremium && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white">
            <p className="font-bold text-base mb-1">Upgrade to Premium</p>
            <p className="text-sm text-green-100 mb-3">Unlimited plants, AI care advice, and export.</p>
            <button
              onClick={() => showToast('Demo mode — upgrade not available')}
              className="bg-white text-green-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors"
            >
              Get Premium
            </button>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => void handleSignOut()}
          className="w-full border border-slate-200 text-slate-600 rounded-2xl py-3.5 font-semibold hover:bg-slate-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
