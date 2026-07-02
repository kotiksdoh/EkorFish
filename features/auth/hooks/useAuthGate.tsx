import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import { hasAuthToken } from "@/features/auth/services/clearAuthSession";
import React, { useCallback, useState } from "react";

export function useAuthGate() {
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const openLogin = useCallback(() => {
    setLoginModalVisible(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginModalVisible(false);
  }, []);

  const requireAuth = useCallback(async (): Promise<boolean> => {
    if (await hasAuthToken()) {
      return true;
    }
    openLogin();
    return false;
  }, [openLogin]);

  const authGateModal = (
    <LoginModal
      visible={loginModalVisible}
      onClose={closeLogin}
      onLogin={closeLogin}
      enumFlag="login"
    />
  );

  return { requireAuth, openLogin, closeLogin, authGateModal };
}
