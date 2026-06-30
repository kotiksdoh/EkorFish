import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { getMyInfo, getTowns, updateUserTown } from "@/features/auth/authSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { AppModal } from "@/features/shared/ui/AppModal";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedStackedSheet } from "./AnimatedStackedSheet";

const { height: screenHeight } = Dimensions.get("window");
const MODAL_TOP_GAP = 100;

interface TownSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  storageId: string;
  onTownSelected: (selectedStorageId: string) => void;
  /** Без отдельного Modal — для вложения в fullScreen Modal (iOS). */
  embedded?: boolean;
  /** Bottom sheet поверх уже открытого fullScreen Modal (без вложенного Modal). */
  stacked?: boolean;
  /** Только выбор склада без обновления профиля (заявка на возврат). */
  selectionOnly?: boolean;
}

export const TownSelectionModal: React.FC<TownSelectionModalProps> = ({
  visible,
  onClose,
  storageId,
  onTownSelected,
  embedded = false,
  stacked = false,
  selectionOnly = false,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const dispatch = useAppDispatch();
  const towns = useAppSelector((state) => state.auth.towns);
  const isLoadingTowns = useAppSelector((state) => state.auth.isLoadingTowns);
  const me = useAppSelector((state) => state.auth.me);
  const insets = useSafeAreaInsets();

  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isClosing, setIsClosing] = useState(false);
  const wasVisibleRef = useRef(false);

  const footerBottomPadding = stacked
    ? 8
    : Math.max(insets.bottom, 48) + 16;

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      return;
    }

    const justOpened = !wasVisibleRef.current;
    wasVisibleRef.current = true;

    if (!justOpened) return;

    if (storageId) {
      setSelectedTownId(storageId);
    } else if (me?.storageId) {
      setSelectedTownId(me.storageId);
    }

    dispatch(getTowns());

    if (embedded || stacked) return;

    modalTranslateY.setValue(screenHeight);
    Animated.spring(modalTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.85,
    }).start();
  }, [visible, dispatch, embedded, stacked, modalTranslateY, storageId, me?.storageId]);

  const closeModalWithAnimation = (onClosed?: () => void) => {
    const afterClose = typeof onClosed === "function" ? onClosed : undefined;

    if (embedded || stacked || selectionOnly) {
      onClose();
      afterClose?.();
      return;
    }

    if (isClosing) return;

    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setIsClosing(false);
      modalTranslateY.setValue(screenHeight);
      onClose();
      afterClose?.();
    });
  };

  const handleOverlayPress = () => {
    if (!isClosing) {
      closeModalWithAnimation();
    }
  };

  const handleTownSelect = (townId: string) => {
    setSelectedTownId(townId);
  };

  const handleApplyPress = async () => {
    if (!selectedTownId) return;

    if (selectionOnly) {
      onTownSelected(selectedTownId);
      onClose();
      return;
    }

    setIsUpdating(true);

    try {
      await dispatch(
        updateUserTown({
          storageId: selectedTownId,
        }),
      );
      await dispatch(getMyInfo(""));
      closeModalWithAnimation(() => {
        onTownSelected(selectedTownId);
      });
    } catch (error) {
      console.error("Error updating town:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const townList = (
    <ScrollView
      style={[
        styles.modalContent,
        (embedded || stacked) && styles.modalContentEmbedded,
        stacked && styles.modalContentStacked,
      ]}
      contentContainerStyle={
        embedded || stacked ? styles.scrollContentEmbedded : styles.scrollContent
      }
      showsVerticalScrollIndicator={false}
    >
      {isLoadingTowns ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#203686" />
          <ThemedText style={styles.loadingText}>Загрузка городов...</ThemedText>
        </View>
      ) : (
        <>
          {towns.map((town) => (
            <TouchableOpacity
              key={town.id}
              style={[
                styles.townItem,
                isDarkMode && {
                  borderBottomColor: "#323235",
                },
              ]}
              onPress={() => handleTownSelect(town.id)}
              disabled={isUpdating}
            >
              <View style={styles.townItemContent}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedTownId === town.id && styles.radioOuterSelected,
                    isDarkMode &&
                      selectedTownId === town.id && {
                        borderColor: "#4C94FF",
                      },
                  ]}
                >
                  {selectedTownId === town.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText style={styles.townName}>{town.value}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}

          {towns.length === 0 && !isLoadingTowns && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>Города не найдены</ThemedText>
            </View>
          )}
        </>
      )}

    </ScrollView>
  );

  const applyButton = (
    <ThemedView
      darkColor="#202022"
      lightColor="#FFFFFF"
      style={[
        styles.applyButtonContainer,
        { paddingBottom: footerBottomPadding },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.applyButton,
          isDarkMode && {
            backgroundColor: "#3881EE",
          },
          (!selectedTownId || isUpdating) && styles.applyButtonDisabled,
        ]}
        onPress={handleApplyPress}
        disabled={!selectedTownId || isUpdating}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <ThemedText style={styles.applyButtonText}>Применить</ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );

  if (!visible && !isClosing) {
    return null;
  }

  if (stacked) {
    return (
      <AnimatedStackedSheet
        visible={visible}
        onClose={() => closeModalWithAnimation()}
        contentHorizontalPadding={0}
      >
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>Укажите город</ThemedText>
        </View>
        {townList}
        {applyButton}
      </AnimatedStackedSheet>
    );
  }

  if (embedded) {
    return (
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.embeddedRoot}
      >
        <ModalHeader
          title="Укажите город"
          showBackButton
          onBackPress={() => closeModalWithAnimation()}
        />
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.embeddedContent}
        >
          {townList}
          {applyButton}
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <AppModal
      visible={visible || isClosing}
      animationType="none"
      transparent={true}
      onRequestClose={() => closeModalWithAnimation()}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                isDarkMode
                  ? {
                      backgroundColor: "#202022",
                    }
                  : {
                      backgroundColor: "#FFFFFF",
                    },
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.swipeHandleContainer}
                activeOpacity={0.7}
                onPress={() => closeModalWithAnimation()}
              >
                <View style={styles.swipeHandle} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Укажите город</ThemedText>
              </View>

              {townList}
              {applyButton}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  embeddedRoot: {
    flex: 1,
  },
  embeddedContent: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingTop: MODAL_TOP_GAP,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontFamily: "Montserrat",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalContentEmbedded: {
    flex: 1,
    paddingTop: 8,
  },
  modalContentStacked: {
    flexGrow: 0,
    maxHeight: 320,
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentEmbedded: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  townItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  townItemContent: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  townName: {
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#203686",
    borderWidth: 5,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#80818B",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#80818B",
  },
  applyButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  applyButton: {
    backgroundColor: "#203686",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.5,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "600",
  },
});
