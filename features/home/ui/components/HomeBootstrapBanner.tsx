import { runAppBootstrap } from "@/features/auth/authSlice";
import { BootstrapConnectionBanner } from "@/features/shared/ui/BootstrapConnectionBanner";
import { useAppDispatch } from "@/store/hooks";
import React, { useCallback } from "react";

export function HomeBootstrapBanner() {
  const dispatch = useAppDispatch();

  const handleRefresh = useCallback(
    () => dispatch(runAppBootstrap({ skipTimeout: true })).unwrap(),
    [dispatch],
  );

  return <BootstrapConnectionBanner onRefresh={handleRefresh} />;
}
