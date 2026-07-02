import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-theme-color";
import React, { useMemo } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const DAYS_IN_MONTH = 31;
const COLUMNS = 7;
const HORIZONTAL_PADDING = 40;
const CELL_SIZE = 40;

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
    return Math.min(CELL_SIZE, Math.floor(availableWidth / COLUMNS));
  }, []);

  const days = useMemo(
    () => Array.from({ length: DAYS_IN_MONTH }, (_, index) => index + 1),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.grid, { width: cellSize * COLUMNS }]}>
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
    alignItems: "center",
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
