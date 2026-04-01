import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { getMyReturnableOrders } from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  View,
  useColorScheme
} from "react-native";
import { PrimaryButton } from "../home";

const { width: screenWidth } = Dimensions.get("window");

interface MyReturnsFirstStepProps {
  visible: boolean;
  onClose: () => void;
}

export const MyReturnsModal: React.FC<MyReturnsFirstStepProps> = ({
  visible,
  onClose,
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const loading = useAppSelector((state) => state.catalog.isLoadingReturns);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);

  const dispatch = useAppDispatch();
  const onCreateReturn = () => {
    
  }
  useFocusEffect(
    useCallback(() => {
      const checkToken = async () => {
        if (visible) {
          dispatch(getMyReturnableOrders());
        }
      };
      checkToken();
    }, [])
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("@/assets/icons/png/noReturns.png")}
        style={styles.emptyImage}
        contentFit="cover"
      />
      <View>
        <ThemedText
            style={styles.emptyTextMain}
            lightColor="#1B1B1C"
        >
            У вас еще нет заявок{"\n"}на возврат.
        </ThemedText>
        <ThemedText
            style={styles.emptyText}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
        >
            Возврат возможен в течение 24 часов{"\n"}с момента получения заказа. 
        </ThemedText>
      </View>
      {onCreateReturn && (
        <PrimaryButton
            title="Продолжить"
            onPress={onCreateReturn}
            variant="primary"
            size="md"
            activeOpacity={0.8}
            fullWidth
        />
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
      <ThemedText
        style={styles.loadingText}
        lightColor="#80818B"
        darkColor="#FBFCFF80"
      >
        Загрузка заявок...
      </ThemedText>
    </View>
  );

  // const renderReturnsList = () => (
  //   <FlatList
  //     data={returns}
  //     keyExtractor={(item) => item.id.toString()}
  //     showsVerticalScrollIndicator={false}
  //     renderItem={({ item }) => <ReturnsCard returns={item} fullWidth={true} statuses={returnsStatuses} currentCompany={currentCompany}/>}
  //     contentContainerStyle={styles.returnsList}
  //     ListEmptyComponent={!loading ? renderEmptyState : null}
  //   />
  // );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Возвраты"
          showBackButton={true}
          onBackPress={() => {
            onClose();
          }}
        />

        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.content}
        >
          {/* {returns.length > 0 ? (
            <>
              <View style={styles.returnsContent}>
                {loading ? renderLoadingState() : renderReturnsList()}
              </View>

              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.createReturnButton}
                  onPress={onCreateReturn}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.createReturnButtonText}>
                    + Создать заявку на возврат
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            renderEmptyState()
          )} */}
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  content: {
    marginTop: 8,
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  returnsList: {
    gap: 8,
    paddingBottom: 20,
  },
  headerButtons: {
    marginBottom: 16,
  },
  createReturnButton: {
    backgroundColor: "#203686",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createReturnButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  returnsContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 24,
  },
  emptyImage: {
    width: 86,
    height: 86,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyTextMain: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: "center",
    marginBottom: 8
  },
  createButton: {
    backgroundColor: "#203686",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },

});