import type { CompanyLike } from "@/features/shared/utils/companyType";
import { isIndividualCompany } from "@/features/shared/utils/companyType";

export type PresetOwnerPayload = {
  companyId?: string;
  individualProfileId?: string;
};

type MeLike = {
  companies?: { id: string; name?: string }[];
  individualProfile?: {
    id: string;
    firstName?: string;
    lastName?: string;
    patronymic?: string;
  };
} | null;

export function formatIndividualProfileName(
  profile?: MeLike["individualProfile"],
): string {
  if (!profile) return "";
  return `${profile.firstName || ""} ${profile.lastName || ""} ${profile.patronymic || ""}`.trim();
}

export function buildPresetOwnerPayload(
  company: CompanyLike,
  me?: MeLike,
): PresetOwnerPayload {
  const payload: PresetOwnerPayload = {};

  if (isIndividualCompany(company)) {
    if (company?.id) {
      payload.individualProfileId = company.id;
    }
  } else if (company?.id) {
    payload.companyId = company.id;
  }

  if (me?.companies?.length === 0 && me?.individualProfile?.id) {
    payload.individualProfileId = me.individualProfile.id;
    delete payload.companyId;
  }

  return payload;
}

export function resolveCompanyFromPreset(
  preset: {
    companyId?: string | null;
    individualProfileId?: string | null;
    companyName?: string | null;
  } | null | undefined,
  companies: { id: string; name?: string }[],
  me: MeLike,
  currentCompany: CompanyLike,
): CompanyLike {
  if (!preset) return currentCompany ?? null;

  if (preset.companyId) {
    const match = companies.find((c) => c.id === preset.companyId);
    return (
      match || {
        id: preset.companyId,
        name: preset.companyName || "Компания",
      }
    );
  }

  if (preset.individualProfileId) {
    if (me?.individualProfile?.id === preset.individualProfileId) {
      return {
        id: preset.individualProfileId,
        name:
          formatIndividualProfileName(me.individualProfile) ||
          currentCompany?.name ||
          "Физлицо",
        type: "individual",
      };
    }

    if (isIndividualCompany(currentCompany)) {
      return currentCompany;
    }

    return {
      id: preset.individualProfileId,
      name: currentCompany?.name || "Физлицо",
      type: "individual",
    };
  }

  return currentCompany ?? null;
}

export function getPresetCompanyDisplayName(
  company: CompanyLike,
  me?: MeLike,
): string {
  if (company?.name?.trim()) {
    return company.name.trim();
  }

  if (isIndividualCompany(company)) {
    return formatIndividualProfileName(me?.individualProfile) || "Физлицо";
  }

  return "Выберите компанию";
}

export function isPresetPrivateToLogin(preset: {
  isPrivateToLogin?: boolean;
  userLoginId?: string | null;
} | null | undefined): boolean {
  if (!preset) return true;
  if (typeof preset.isPrivateToLogin === "boolean") {
    return preset.isPrivateToLogin;
  }
  return preset.userLoginId != null;
}
