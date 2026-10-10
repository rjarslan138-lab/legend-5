'use client';

import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme, toggleTheme } from '@/store/slices/uiSlice';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  variant?: 'button' | 'icon' | 'pill' | 'segmented';
}

export default function ThemeToggle({
  showLabel = false,
  className = '',
  variant = 'segmented',
}: ThemeToggleProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const isLight = theme === 'light';

  // Segmented Pill with both options clearly visible
  if (variant === 'segmented' || variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-full border transition-all ${
          isLight
            ? 'bg-slate-200/80 border-slate-300'
            : 'bg-slate-900/90 border-slate-800'
        } ${className}`}
        role="group"
        aria-label="Theme switcher"
      >
        {/* White / Light Theme Button */}
        <button
          type="button"
          onClick={() => dispatch(setTheme('light'))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            isLight
              ? 'bg-white text-amber-600 shadow-sm border border-amber-200'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Switch to White Theme"
          aria-pressed={isLight}
        >
          <FiSun className={`w-3.5 h-3.5 ${isLight ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>White</span>
        </button>

        {/* Dark Theme Button */}
        <button
          type="button"
          onClick={() => dispatch(setTheme('dark'))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            !isLight
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Switch to Dark Theme"
          aria-pressed={!isLight}
        >
          <FiMoon className={`w-3.5 h-3.5 ${!isLight ? 'text-white' : 'text-slate-500'}`} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  // Single Action Button / Icon
  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className={`relative p-2 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
        isLight
          ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-amber-400'
      } ${className}`}
      title={isLight ? 'Switch to Dark Theme' : 'Switch to White Theme'}
      aria-label={isLight ? 'Switch to Dark Theme' : 'Switch to White Theme'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isLight ? (
          <FiMoon className="w-4 h-4 text-slate-600" />
        ) : (
          <FiSun className="w-4 h-4 text-amber-400" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold">
          {isLight ? 'Dark Theme' : 'White Theme'}
        </span>
      )}
    </button>
  );
}
