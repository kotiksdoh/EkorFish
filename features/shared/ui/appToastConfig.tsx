import { AppText } from "@/components/app-text";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type ToastVariant = "success" | "error" | "info" | "warn";

type Palette = {
  bg: string;
  border: string;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  close: string;
};

const PALETTES: Record<ToastVariant, { light: Palette; dark: Palette }> = {
  success: {
    light: {
      bg: "#FFFFFF",
      border: "#A7F3D0",
      icon: "#059669",
      iconBg: "#ECFDF5",
      title: "#065F46",
      subtitle: "#047857",
      close: "#6B7280",
    },
    dark: {
      bg: "#151516",
      border: "#166534",
      icon: "#34D399",
      iconBg: "#052E16",
      title: "#ECFDF5",
      subtitle: "#A7F3D0",
      close: "#9CA3AF",
    },
  },
  error: {
    light: {
      bg: "#FFFFFF",
      border: "#FECACA",
      icon: "#DC2626",
      iconBg: "#FEF2F2",
      title: "#991B1B",
      subtitle: "#B91C1C",
      close: "#6B7280",
    },
    dark: {
      bg: "#151516",
      border: "#991B1B",
      icon: "#F87171",
      iconBg: "#450A0A",
      title: "#FEE2E2",
      subtitle: "#FECACA",
      close: "#9CA3AF",
    },
  },
  info: {
    light: {
      bg: "#FFFFFF",
      border: "#BFDBFE",
      icon: "#203686",
      iconBg: "#EFF6FF",
      title: "#1E3A5F",
      subtitle: "#203686",
      close: "#6B7280",
    },
    dark: {
      bg: "#151516",
      border: "#3B5998",
      icon: "#4C94FF",
      iconBg: "#0C1929",
      title: "#E0E7FF",
      subtitle: "#93C5FD",
      close: "#9CA3AF",
    },
  },
  warn: {
    light: {
      bg: "#FFFFFF",
      border: "#FDE68A",
      icon: "#D97706",
      iconBg: "#FFFBEB",
      title: "#92400E",
      subtitle: "#B45309",
      close: "#6B7280",
    },
    dark: {
      bg: "#151516",
      border: "#CA8A04",
      icon: "#FBBF24",
      iconBg: "#451A03",
      title: "#FEF3C7",
      subtitle: "#FDE68A",
      close: "#9CA3AF",
    },
  },
};

const ICON_NAMES: Record<
  ToastVariant,
  keyof typeof Ionicons.glyphMap
> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
  warn: "warning",
};

function AppToastCard({
  variant,
  text1,
  text2,
  hide,
  isDark,
}: {
  variant: ToastVariant;
  text1?: string;
  text2?: string;
  hide?: () => void;
  isDark: boolean;
}): ReactNode {
  const p = PALETTES[variant][isDark ? "dark" : "light"];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
        },
      ]}
    >
      <View style={[styles.iconBubble, { backgroundColor: p.iconBg }]}>
        <Ionicons name={ICON_NAMES[variant]} size={22} color={p.icon} />
      </View>
      <View style={styles.textBlock}>
        {text1 ? (
          <AppText style={[styles.title, { color: p.title }]} numberOfLines={4}>
            {text1}
          </AppText>
        ) : null}
        {text2 ? (
          <AppText style={[styles.subtitle, { color: p.subtitle }]} numberOfLines={6}>
            {text2}
          </AppText>
        ) : null}
      </View>
      <Pressable
        onPress={hide}
        hitSlop={14}
        style={({ pressed }) => [
          styles.dismissHit,
          pressed && styles.dismissPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Закрыть уведомление"
      >
        <Ionicons name="close" size={22} color={p.close} />
      </Pressable>
    </View>
  );
}

export function buildAppToastConfig(isDark: boolean) {
  const card = (variant: ToastVariant) => (props: any) =>
    (
      <AppToastCard
        variant={variant}
        text1={props.text1}
        text2={props.text2}
        hide={props.hide}
        isDark={isDark}
      />
    );

  return {
    success: card("success"),
    error: card("error"),
    info: card("info"),
    warn: card("warn"),
    default: card("info"),
  };
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingRight: 8,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.95,
  },
  dismissHit: {
    padding: 6,
    borderRadius: 10,
    marginTop: -2,
  },
  dismissPressed: {
    opacity: 0.55,
  },
});
