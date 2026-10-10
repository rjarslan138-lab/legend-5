'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useLogoutMutation } from '@/store/api/apiSlice';
import { logoutUser } from '@/store/slices/authSlice';
import StatusBadge from '../ui/StatusBadge';
import ThemeToggle from '../ui/ThemeToggle';
import toast from 'react-hot-toast';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi({}).unwrap();
    } catch (e) {
      // ignore
    } finally {
      dispatch(logoutUser());
      toast.success('Logged out');
      router.push('/login');
    }
  };

  const tabs = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Production', href: '#', badge: 'Coming soon', disabled: true },
    { name: 'Warehouse', href: '/warehouse' },
    { name: 'Orders', href: '/orders' },
    { name: 'Traceability', href: '/trace' },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200 shadow-sm">
      {/* Top Bar: Breadcrumb, Theme Switch & User profile */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
        {/* Deck-style Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <span className="font-semibold text-slate-800 dark:text-slate-100">GarmentFlow</span>
          <span className="text-slate-400 dark:text-slate-500">/</span>
          <span className="text-teal-600 dark:text-teal-400 font-semibold">Operations</span>
          {pathname !== '/dashboard' && (
            <>
              <span className="text-slate-400 dark:text-slate-500">/</span>
              <span className="text-slate-600 dark:text-slate-400 capitalize font-medium">
                {pathname.replace('/', '').replace('-', ' ')}
              </span>
            </>
          )}
        </div>

        {/* Right side: Theme Toggle + User profile + Logout */}
        <div className="flex items-center space-x-3">
          {/* White / Dark Segmented Theme Toggle Button */}
          <ThemeToggle variant="segmented" />

          {user && (
            <div className="flex items-center space-x-3 pl-1 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                <div className="mt-0.5">
                  <StatusBadge status={user.role} size="sm" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition font-medium"
            title="Log Out"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Operations Sub-Tabs */}
      <div className="px-6 flex items-center space-x-6 overflow-x-auto text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800/20">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href) && tab.href !== '#');

          if (tab.disabled) {
            return (
              <div
                key={tab.name}
                className="py-3 text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 cursor-not-allowed select-none font-medium"
              >
                <span>{tab.name}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
                  {tab.badge}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`py-3 font-medium transition border-b-2 flex items-center space-x-1 whitespace-nowrap ${
                isActive
                  ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
