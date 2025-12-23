// features/auth/hooks/useAuth.ts
import { AppDispatch, TRootState } from '@/store/store';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth, setAuthError, setAuthLoading, setPhoneNumber } from '../authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { error, isLoading, phoneNumber } = useSelector((state: TRootState) => state.auth);

  const login = useCallback(async (phone: string) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));
    
    try {
      dispatch(setPhoneNumber(phone));
    } catch (err: any) {
      dispatch(setAuthError(err.message || 'Ошибка авторизации'));
    } finally {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch]);

  const verifyCode = useCallback(async (code: string) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));
    
    try {
      return true;
    } catch (err: any) {
      dispatch(setAuthError(err.message || 'Неверный код подтверждения'));
      return false;
    } finally {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(setAuthError(null));
  }, [dispatch]);

  const resetAuth = useCallback(() => {
    dispatch(clearAuth());
  }, [dispatch]);

  return {
    error,
    isLoading,
    phoneNumber,
    login,
    verifyCode,
    clearError,
    resetAuth,
  };
};