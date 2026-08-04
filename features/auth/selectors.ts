import type { TRootState } from "@/store/store";

/** Город для API: профиль, иначе локально выбранный (гость). */
export function selectEffectiveStorageId(state: TRootState): string | null {
  const fromProfile = state.auth.me?.storageId;
  if (fromProfile != null && String(fromProfile).trim()) {
    return String(fromProfile);
  }
  const pending = state.auth.pendingStorageId;
  if (pending != null && String(pending).trim()) {
    return String(pending);
  }
  return null;
}

export function selectTownNameByStorageId(
  state: TRootState,
  storageId: string | null | undefined,
): string | null {
  if (!storageId) return null;
  return (
    state.auth.towns.find((town) => String(town.id) === String(storageId))
      ?.value ?? null
  );
}
