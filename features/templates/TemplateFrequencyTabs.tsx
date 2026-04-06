import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useEffect, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import type { ReminderFrequency } from "./types";
import { REMINDER_LABELS } from "./types";

const TABS: ReminderFrequency[] = ["daily", "weekly", "monthly", "off"];

type Props = {
  value: ReminderFrequency;
  onChange: (v: ReminderFrequency) => void;
};

export function TemplateFrequencyTabs({ value, onChange }: Props) {
  const systemTheme = useColorScheme();
  const isDark = (systemTheme || "light") === "dark";
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [tabAnim] = useState(new Animated.Value(0));

  const activeIndex = TABS.indexOf(value) >= 0 ? TABS.indexOf(value) : 0;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    const cleanWidth = width - 6;
    setSegmentWidth(cleanWidth / TABS.length);
  };

  useEffect(() => {
    tabAnim.setValue(activeIndex);
  }, [activeIndex, tabAnim]);

  const handleChange = (tab: ReminderFrequency, index: number) => {
    Animated.spring(tabAnim, {
      toValue: index,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
    onChange(tab);
  };

  const indicatorPosition =
    segmentWidth > 0
      ? tabAnim.interpolate({
          inputRange: [0, 1, 2, 3],
          outputRange: [0, segmentWidth, segmentWidth * 2, segmentWidth * 3],
        })
      : new Animated.Value(0);

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.label} lightColor="#80818B" darkColor="#FBFCFF80">
        Частота напоминания
      </ThemedText>
      <ThemedView
        style={styles.tabsContainer}
        lightColor="#F2F4F7"
        darkColor="#202022"
        onLayout={handleLayout}
      >
        {segmentWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              isDark && { backgroundColor: "#101013" },
              {
                width: segmentWidth,
                transform: [{ translateX: indicatorPosition }],
              },
            ]}
          />
        )}
        {TABS.map((tab, index) => {
          const selected = value === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabBtn}
              onPress={() => handleChange(tab, index)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[styles.tabText, selected && styles.tabTextActive]}
                lightColor={selected ? "#1B1B1C" : "#80818B"}
                darkColor={selected ? "#FBFCFF" : "#FBFCFF80"}
                numberOfLines={2}
              >
                {REMINDER_LABELS[tab]}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: "500" },
  tabsContainer: {
    borderRadius: 12,
    padding: 3,
    flexDirection: "row",
    position: "relative",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  indicator: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    height: "100%",
    top: 3,
    left: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  tabTextActive: { fontWeight: "600" },
});
