'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import LandingPage from '@/components/landing/LandingPage';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-display font-bold text-xl text-white animate-pulse-glow">
            G
          </div>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <LandingPage />;
}
