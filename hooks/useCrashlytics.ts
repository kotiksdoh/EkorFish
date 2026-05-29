import { setCrashlyticsUserId, initCrashlytics } from "@/features/shared/services/crashlytics";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";

export function useCrashlytics() {
  useEffect(() => {
    void initCrashlytics();
  }, []);
}

export function useCrashlyticsUser() {
  const me = useAppSelector((state) => state.auth.me);
  const phoneNumber = useAppSelector((state) => state.auth.phoneNumber);

  useEffect(() => {
    const userId =
      me?.id ??
      me?.userId ??
      me?.accountId ??
      (phoneNumber ? `phone:${phoneNumber}` : null);

    void setCrashlyticsUserId(userId ?? null);
  }, [me, phoneNumber]);
}
