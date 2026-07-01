import { InfoIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View } from "react-native";

type CheckoutBlockerHintProps = {
  messages: string[];
};

export function CheckoutBlockerHint({ messages }: CheckoutBlockerHintProps) {
  const isDarkMode = useColorScheme() === "dark";

  if (messages.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {messages.map((message) => (
        <ThemedView
          key={message}
          darkColor="#202022"
          lightColor="#F2F4F7"
          style={styles.item}
        >
          <ThemedView
            darkColor="#151516"
            lightColor="#FFFFFF"
            style={styles.iconWrap}
          >
            <InfoIcon
              stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
              fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
            />
          </ThemedView>
          <ThemedText
            darkColor="#FBFCFF"
            lightColor="#1B1B1C"
            style={styles.text}
          >
            {message}
          </ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 16,
    gap: 8,
  },
  item: {
    padding: 8,
    flexDirection: "row",
    borderRadius: 16,
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    borderRadius: 10,
    padding: 10,
  },
  text: {
    flex: 1,
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 18,
  },
});
