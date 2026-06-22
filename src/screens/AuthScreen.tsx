import React, { useState } from 'react';
import { isDemoMode } from '../lib/config';
import { useStore } from '../lib/store';
import { signInEmail, signUpEmail, signInGoogle } from '../lib/firebase';
import { DEMO_USER } from '../demo/seed';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const setUser = useStore((s) => s.setUser);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex flex-col items-center justify-center p-7">
        <div className="w-full max-w-sm">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="text-7xl mb-4">🌿</div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">PlantPal</h1>
            <p className="text-slate-500 text-base">AI plant ID + smart care reminders</p>
          </div>

          {isDemoMode ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-3">
              <p className="text-green-700 font-bold text-base">Demo Mode Active</p>
              <p className="text-slate-500 text-sm leading-relaxed">
                3 pre-loaded plants with a full 7-day care schedule. No credentials needed.
              </p>
              <button
                onClick={() => setUser(DEMO_USER)}
                className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-base hover:bg-green-700 transition-colors"
              >
                Continue as Demo User →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google */}
              <button
                onClick={() => void handleGoogle()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-2xl py-3.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <span className="text-lg">G</span>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Email/password form */}
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white rounded-2xl py-4 font-bold text-base hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
