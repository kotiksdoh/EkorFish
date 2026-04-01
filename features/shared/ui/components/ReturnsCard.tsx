import { ThemedText } from "@/components/themed-text";
import React from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";

interface ReturnsCardProps {
  returns: any; 
  fullWidth?: boolean;
  onPress?: () => void;
}

const ReturnsCard: React.FC<ReturnsCardProps> = ({
  returns,
  fullWidth = false,
  onPress,
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.card,
        fullWidth && styles.fullWidthCard,
        isDark && styles.darkCard,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.returnNumber}>
          Возврат №{returns.id}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            returns.status === "approved" && styles.approvedBadge,
            returns.status === "pending" && styles.pendingBadge,
            returns.status === "rejected" && styles.rejectedBadge,
          ]}
        >
          <ThemedText style={styles.statusText}>
            {returns.status === "approved" && "Одобрен"}
            {returns.status === "pending" && "На рассмотрении"}
            {returns.status === "rejected" && "Отклонен"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Дата заявки:</ThemedText>
          <ThemedText style={styles.value}>{returns.createdAt}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Заказ №:</ThemedText>
          <ThemedText style={styles.value}>{returns.orderNumber}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Сумма возврата:</ThemedText>
          <ThemedText style={styles.value}>{returns.amount} ₽</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Причина:</ThemedText>
          <ThemedText style={styles.value} numberOfLines={2}>
            {returns.reason}
          </ThemedText>
        </View>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: "#202022",
  },
  fullWidthCard: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  returnNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  approvedBadge: {
    backgroundColor: "#E8F5E9",
  },
  pendingBadge: {
    backgroundColor: "#FFF3E0",
  },
  rejectedBadge: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 14,
    color: "#80818B",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});

export default ReturnsCard;