import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  language: localStorage.getItem('language') || 'en',
  sidebarOpen: true,
  notifications: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
      document.documentElement.setAttribute('dir', action.payload === 'ar' || action.payload === 'he' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const {
  setTheme,
  setLanguage,
  toggleSidebar,
  addNotification,
  removeNotification,
  clearNotifications
} = uiSlice.actions;

export default uiSlice.reducer;
