'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { Toaster } from 'react-hot-toast';
import { useGetMeQuery } from '@/store/api/apiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logoutUser, setAuthLoading } from '@/store/slices/authSlice';
import { setTheme, AppTheme } from '@/store/slices/uiSlice';

function ThemeWatcher({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  // Initialize theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('garmentflow_theme') as AppTheme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        dispatch(setTheme(savedTheme));
      }
    } catch {}
  }, [dispatch]);

  // Sync DOM classes whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  return <>{children}</>;
}

function AuthWatcher({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data, isSuccess, isError, isLoading } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch(setAuthLoading(true));
    } else if (isSuccess && data?.data) {
      dispatch(
        setCredentials({
          user: data.data,
        })
      );
    } else if (isError) {
      dispatch(logoutUser());
    }
  }, [data, isSuccess, isError, isLoading, dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeWatcher>
        <AuthWatcher>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
              },
            }}
          />
        </AuthWatcher>
      </ThemeWatcher>
    </Provider>
  );
}
