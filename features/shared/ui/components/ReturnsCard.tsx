import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatDate } from "../../services/utils";

interface ReturnsCardProps {
  returns: any; 
  statuses: any[];
  currentCompany: any;
  fullWidth?: boolean;
  onPress?: () => void;
}

export enum ReturnStatus {

}

const ReturnsCard: React.FC<ReturnsCardProps> = ({
  returns,
  fullWidth = false,
  onPress,
  statuses,
  currentCompany
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";
  
  const CardWrapper = onPress ? TouchableOpacity : View;

  console.log('statuses', statuses)
  const returnStatus = (status: number) => {
    return statuses?.returnRequestStatuses?.find((item: any) => item.status === status)?.name
  }
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
           Заявка от {formatDate(returns.createdAt)}
        </ThemedText>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              returns.status === 0 && styles.pendingBadge,
              returns.status === 1 && styles.approvedBadge,
              returns.status === 2 && styles.rejectedBadge,
            ]}
          >
            <ThemedText style={styles.statusText}>
                {returnStatus(returns.status)}
            </ThemedText>
          </View>
          <View style={styles.statusCount}>
          <ThemedText style={styles.statusCountText} lightColor="#80818B">
            {returns.totalProductsCount} товара • {returns.totalRefundAmount} ₽ 
          </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Заказ №{returns.id} · {currentCompany?.name}</ThemedText>
        </View>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F2F4F7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: "#202022",
  },
  fullWidthCard: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    // paddingBottom: 12,
  },
  returnNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusRow:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
    width: '100%'
  },
  statusCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusCountText:{
    fontWeight: '500',
    fontSize: 12
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  approvedBadge: {
    backgroundColor: "#6FBD15",
  },
  pendingBadge: {
    backgroundColor: "#DADFE3",
  },
  rejectedBadge: {
    backgroundColor: "#DADFE3",
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