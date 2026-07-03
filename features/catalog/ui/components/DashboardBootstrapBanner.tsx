import {
  getCategoryItems,
  setBootstrapStatus,
} from "@/features/auth/authSlice";
import { BootstrapConnectionBanner } from "@/features/shared/ui/BootstrapConnectionBanner";
import { useAppDispatch } from "@/store/hooks";
import React, { useCallback } from "react";

export function DashboardBootstrapBanner() {
  const dispatch = useAppDispatch();

  const handleRefresh = useCallback(async () => {
    try {
      await dispatch(getCategoryItems("")).unwrap();
      dispatch(setBootstrapStatus("ready"));
    } catch {
      dispatch(setBootstrapStatus("failed"));
      throw new Error("categories_refresh_failed");
    }
  }, [dispatch]);

  return <BootstrapConnectionBanner onRefresh={handleRefresh} />;
}
