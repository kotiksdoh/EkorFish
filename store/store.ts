// store/store.ts
import authReducer from '@/features/auth/authSlice';
import { configureStore } from '@reduxjs/toolkit';
// import apiReducer from './slices/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type TRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;