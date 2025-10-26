import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reportReducer from './slices/reportSlice';
import chatbotReducer from './slices/chatbotSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportReducer,
    chatbot: chatbotReducer,
    analytics: analyticsReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
