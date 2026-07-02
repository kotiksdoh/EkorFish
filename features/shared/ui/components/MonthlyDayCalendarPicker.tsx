import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-theme-color";
import React, { useMemo } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAYS_IN_MONTH = 31;
const COLUMNS = 7;
const HORIZONTAL_PADDING = 40;

interface MonthlyDayCalendarPickerProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export const MonthlyDayCalendarPicker: React.FC<MonthlyDayCalendarPickerProps> = ({
  selectedDay,
  onSelectDay,
}) => {
  const { isDark } = useAppTheme();

  const cellSize = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    const availableWidth = screenWidth - HORIZONTAL_PADDING;
    return Math.floor(availableWidth / COLUMNS);
  }, []);

  const days = useMemo(
    () => Array.from({ length: DAYS_IN_MONTH }, (_, index) => index + 1),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View
            key={label}
            style={[styles.weekdayCell, { width: cellSize, height: 28 }]}
          >
            <ThemedText
              lightColor="#80818B"
              darkColor="#FBFCFF80"
              style={styles.weekdayText}
            >
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const isSelected = selectedDay === day;

          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayCell, { width: cellSize, height: cellSize }]}
              onPress={() => onSelectDay(day)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.dayCircleSelected,
                  isDark && isSelected && { backgroundColor: "#4C94FF" },
                ]}
              >
                <ThemedText
                  lightColor={isSelected ? "#FFFFFF" : "#1B1B1C"}
                  darkColor={isSelected ? "#FFFFFF" : "#FBFCFF"}
                  style={styles.dayText}
                >
                  {day}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: "#203686",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
