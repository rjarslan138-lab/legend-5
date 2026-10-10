import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppTheme = 'dark' | 'light';

interface UiState {
  sidebarCollapsed: boolean;
  activeTab: string;
  theme: AppTheme;
}

const getInitialTheme = (): AppTheme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('garmentflow_theme') as AppTheme;
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

const initialState: UiState = {
  sidebarCollapsed: false,
  activeTab: 'Overview',
  theme: 'dark',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('garmentflow_theme', state.theme);
      }
    },
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('garmentflow_theme', action.payload);
      }
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setActiveTab, toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
