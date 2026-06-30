// MyReturnsModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { clearReturnRequests, getMyReturns, getMyReturnsParams } from "@/features/catalog/catalogSlice";
import { MyReturnsSecondStep } from "@/features/returns/ReturnsSecondStep";
import { MyReturnsThirdStep } from "@/features/returns/ReturnsThirdStep";
import { MyReturnsFirstStep } from "@/features/returns/ReurnsFirstStep";
import { ReturnDetailModal } from "@/features/shared/ui/ReturnDetailModal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppModal } from "@/features/shared/ui/AppModal";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "./components/PrimartyButton";
import ReturnsCard from "./components/ReturnsCard";

const { width: screenWidth } = Dimensions.get("window");

interface MyReturnsProps {
  visible: boolean;
  onClose: () => void;
}

export const MyReturnsModal: React.FC<MyReturnsProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const loading = useAppSelector((state) => state.catalog.isLoadingReturns);
  const returns = useAppSelector((state) => state.catalog.returns);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);

  const [visibleFirstStep, setVisibleFirstStep] = useState<boolean>(false)
  const [visibleSecondStep, setVisibleSecondStep] = useState<boolean>(false)
  const [visibleThirdStep, setVisibleThirdStep] = useState<boolean>(false)
  const [visibleReturnDetail, setVisibleReturnDetail] = useState<boolean>(false)
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null)

  const dispatch = useAppDispatch();
  const router = useRouter();

  const onCreateReturn = () => {
    setVisibleFirstStep(true)
  }

  const handleExitReturnFlow = useCallback(() => {
    setVisibleFirstStep(false);
    setVisibleSecondStep(false);
    setVisibleThirdStep(false);
    dispatch(clearReturnRequests());
  }, [dispatch]);

  const handleCloseAll = () => {
    handleExitReturnFlow();
    onClose();
  };

  const handleNavigateHomeFromReturn = useCallback(() => {
    handleCloseAll();
    dispatch(getMyReturns());
    router.navigate("/dashboard");
  }, [dispatch, onClose]);

  const handleViewReturnDetails = useCallback(() => {
    handleExitReturnFlow();
    dispatch(getMyReturns());
  }, [dispatch, handleExitReturnFlow]);

  useFocusEffect(
    useCallback(() => {
      const checkToken = async () => {
        if (visible) {
          dispatch(getMyReturns());
          dispatch(getMyReturnsParams())
        }
      };
      checkToken();
    }, [visible])
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
            title="+ Создать заявку на возврат"
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

  /** На iOS второй одновременный fullScreen Modal оказывается под первым и перехватывает касания — показываем список только когда нет дочерних полноэкранных окон. */
  const returnsListModalVisible =
    visible &&
    !visibleFirstStep &&
    !visibleSecondStep &&
    !visibleThirdStep &&
    !visibleReturnDetail;

  const renderReturnsList = () => (
    <FlatList
      data={returns}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ReturnsCard
          returns={item}
          fullWidth={true}
          statuses={returnsStatuses}
          currentCompany={currentCompany}
          onPress={() => {
            setSelectedReturnId(item.id);
            setVisibleReturnDetail(true);
          }}
        />
      )}
      contentContainerStyle={styles.returnsList}
      ListEmptyComponent={!loading ? renderEmptyState : null}
    />
  );

  return (
    <>
      <AppModal
        animationType="slide"
        transparent={false}
        visible={returnsListModalVisible}
        onRequestClose={handleCloseAll}
        presentationStyle="fullScreen"
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
            onBackPress={handleCloseAll}
          />

          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.content}
          >
            {returns.length > 0 ? (
              <>
                <View style={styles.returnsContent}>
                  {loading ? renderLoadingState() : renderReturnsList()}
                </View>

                <View
                  style={[
                    styles.headerButtons,
                    { marginBottom: 1 + insets.bottom },
                  ]}
                >
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
            )}
          </ThemedView>
        </ThemedView>
      </AppModal>

      <MyReturnsFirstStep 
        visible={visibleFirstStep} 
        onClose={handleExitReturnFlow} 
        onNext={() => {
          setVisibleFirstStep(false);
          setVisibleSecondStep(true);
        }}
      />
      
      <MyReturnsSecondStep 
        visible={visibleSecondStep} 
        onClose={handleExitReturnFlow}
        onNext={() => {
          setVisibleSecondStep(false);
          setVisibleThirdStep(true);
        }}
      />
      
      <MyReturnsThirdStep  
        visible={visibleThirdStep} 
        onClose={handleExitReturnFlow}
        onNavigateHome={handleNavigateHomeFromReturn}
        onViewReturnDetails={handleViewReturnDetails}
      />

      <ReturnDetailModal
        visible={visibleReturnDetail}
        onClose={() => setVisibleReturnDetail(false)}
        returnRequestId={selectedReturnId}
      />
    </>
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