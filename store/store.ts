// store/store.ts
import authReducer from '@/features/auth/authSlice';
import catalogReducer from '@/features/catalog/catalogSlice';
import { configureStore } from '@reduxjs/toolkit';
// import apiReducer from './slices/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type TRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;