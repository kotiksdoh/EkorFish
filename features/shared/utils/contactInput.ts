import {
  formatPhoneDisplay,
  normalizePhoneDigits,
  normalizePhoneForTel,
} from "@/features/shared/utils/phoneLinking";

export const EMAIL_REGEX = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

export function formatPhoneInput(text: string): string {
  let cleaned = text.replace(/\D/g, "");
  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("8")) {
    cleaned = `7${cleaned.slice(1)}`;
  } else if (!cleaned.startsWith("7") && cleaned.startsWith("9")) {
    cleaned = `7${cleaned}`;
  }

  cleaned = cleaned.slice(0, 11);
  return formatPhoneDisplay(cleaned);
}

export function isPhoneInputComplete(text: string): boolean {
  const digits = normalizePhoneDigits(text);
  return digits.length === 11 && digits.startsWith("7");
}

export function formatPhoneForApi(text: string): string {
  return normalizePhoneForTel(text);
}

export function sanitizeEmailInput(text: string): string {
  return text.replace(/[^a-zA-Z0-9@._+-]/g, "").slice(0, 254);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isRecipientContactComplete(recipient: {
  fullname?: string;
  phoneNumber?: string;
  email?: string;
}): boolean {
  return Boolean(
    recipient.fullname?.trim() &&
      isPhoneInputComplete(recipient.phoneNumber || "") &&
      isValidEmail(recipient.email || ""),
  );
}
