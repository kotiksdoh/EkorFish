import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** Общий nativeID — можно вешать на несколько TextInput сразу. */
export const IOS_KEYBOARD_DONE_ACCESSORY_ID = "ekorfish.keyboard.done.shared";

/** Панель «Готово» над клавиатурой iOS (для number-pad и сырых TextInput). */
export function IosKeyboardDoneAccessory({
  nativeID = IOS_KEYBOARD_DONE_ACCESSORY_ID,
}: {
  nativeID?: string;
}) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  if (Platform.OS !== "ios") return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View
        style={[
          styles.accessoryBar,
          { backgroundColor: isDarkMode ? "#2C2C2E" : "#D1D3D9" },
        ]}
      >
        <TouchableOpacity
          onPress={Keyboard.dismiss}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Готово"
        >
          <Text
            style={[
              styles.accessoryDone,
              { color: isDarkMode ? "#4C94FF" : "#203686" },
            ]}
          >
            Готово
          </Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.15)",
  },
  accessoryDone: {
    fontSize: 16,
    fontWeight: "600",
  },
});
