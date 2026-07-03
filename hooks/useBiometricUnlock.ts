import {
  authenticateWithBiometrics,
  getBiometricAvailability,
  isBiometricLoginEnabled,
  setBiometricLoginEnabled,
} from "@/features/auth/services/biometricLogin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const RETRY_DELAY_MS = 700;

export function useBiometricUnlock(isAppReady: boolean) {
  const [isRequired, setIsRequired] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticatingRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    cancelledRef.current = false;

    const resolveRequirement = async () => {
      try {
        const [enabled, token] = await Promise.all([
          isBiometricLoginEnabled(),
          AsyncStorage.getItem("token"),
        ]);

        if (!enabled || !token) {
          setIsRequired(false);
          setIsUnlocked(true);
          return;
        }

        const { available } = await getBiometricAvailability();
        if (!available) {
          await setBiometricLoginEnabled(false);
          setIsRequired(false);
          setIsUnlocked(true);
          return;
        }

        setIsRequired(true);
        setIsUnlocked(false);
      } finally {
        if (!cancelledRef.current) {
          setIsChecking(false);
        }
      }
    };

    void resolveRequirement();

    return () => {
      cancelledRef.current = true;
    };
  }, [isAppReady]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (isAuthenticatingRef.current) {
      return false;
    }

    isAuthenticatingRef.current = true;
    try {
      const success = await authenticateWithBiometrics("Войдите в приложение");
      if (success) {
        setIsUnlocked(true);
      }
      return success;
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAppReady || isChecking || !isRequired || isUnlocked) {
      return;
    }

    let active = true;

    const runWithRetry = async () => {
      while (active && isRequired && !isUnlocked) {
        const success = await authenticate();
        if (!active || success) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    };

    void runWithRetry();

    return () => {
      active = false;
    };
  }, [authenticate, isAppReady, isChecking, isRequired, isUnlocked]);

  return {
    isRequired,
    isUnlocked,
    isChecking,
    retry: authenticate,
  };
}
