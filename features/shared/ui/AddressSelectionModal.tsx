// features/shared/ui/AddressSelectionModal.tsx
import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { getCompanyAddresses } from "@/features/catalog/catalogSlice";
import {
  getSavedAddress,
  saveSelectedAddress,
} from "@/features/shared/services/addressStorage";
import { AppModal } from "@/features/shared/ui/AppModal";
import { useAppDispatch } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, useColorScheme } from 'react-native';

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddAddressFormPanel } from "./AddAddressFormPanel";
import { AddAddressModal } from "./AddAddressModal";
import { AnimatedStackedSheet } from "./AnimatedStackedSheet";
import { CompanySelectModal } from "./CompanySelectModal";
import { PrimaryButton } from "./components/PrimartyButton";

const { height: screenHeight } = Dimensions.get("window");

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentCompany: any;
  companies: any[];
  selectedCompanyId?: string;
  selectedAddressId?: string;
  onSelectCompany: (company: any) => void;
  onSelectAddress: (address: any) => void;
  onAddCompany: () => void;
  onAddressAdded?: (address: any) => void;
  /** Без отдельного Modal — для вложения в fullScreen Modal (iOS). */
  embedded?: boolean;
  /** Bottom sheet поверх уже открытого fullScreen Modal (без вложенного Modal). */
  stacked?: boolean;
  /** Переопределение заголовка (например, заявка на возврат). */
  modalTitle?: string;
}

export const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  visible,
  onClose,
  currentCompany,
  companies,
  selectedCompanyId,
  selectedAddressId,
  onSelectCompany,
  onSelectAddress,
  onAddCompany,
  onAddressAdded,
  embedded = false,
  stacked = false,
  modalTitle,
}) => {
  const addressModalTitle = modalTitle ?? "Выберите адрес доставки";
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isClosing, setIsClosing] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [localAddresses, setLocalAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && currentCompany?.id) {
      loadAddresses();
      loadSavedAddress();
    }
  }, [visible, currentCompany?.id]);

  useEffect(() => {
    if (!visible) {
      setShowCompanyModal(false);
      setShowAddAddressModal(false);
    }
  }, [visible]);

  const loadSavedAddress = async () => {
    if (!currentCompany?.id) return;

    const saved = await getSavedAddress(currentCompany.id);
    if (saved) {
      setSavedAddressId(saved.addressId);
    } else {
      setSavedAddressId(null);
    }
  };

  const loadAddresses = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const result = await dispatch(getCompanyAddresses(currentCompany.id));
      if (getCompanyAddresses.fulfilled.match(result)) {
        setLocalAddresses(result.payload || []);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (embedded || stacked || !visible) return;

    modalTranslateY.setValue(screenHeight);
    Animated.spring(modalTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    }).start();
  }, [visible, embedded, stacked]);

  const closeModalWithAnimation = () => {
    if (embedded || stacked) {
      onClose();
      return;
    }

    if (isClosing) return;

    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsClosing(false);
      onClose();
    });
  };

  const handleSelectAddress = async (address: any) => {
    if (currentCompany?.id) {
      await saveSelectedAddress(currentCompany.id, address);
    }

    onSelectAddress(address);
    closeModalWithAnimation();
  };

  const handleSelectCompany = (company: any) => {
    onSelectCompany(company);
    setShowCompanyModal(false);
  };

  const handleAddressAdded = async (newAddress: any) => {
    setShowAddAddressModal(false);
    await loadAddresses();
    if (onAddressAdded && newAddress) {
      onAddressAdded(newAddress);
    }
  };

  const effectiveSelectedId = selectedAddressId || savedAddressId;

  const deliveryAddresses =
    localAddresses.length > 0
      ? localAddresses
      : currentCompany?.deliveryAddresses || [];

  if (!visible) {
    return null;
  }

  const buttonsBottomPadding = stacked
    ? 8
    : Math.max(insets.bottom, Platform.OS === "android" ? 28 : 16) + 16;

  const addressList = (
    <>
      {!embedded && !stacked && (
        <TouchableOpacity
          style={styles.swipeHandleContainer}
          activeOpacity={0.7}
          onPress={closeModalWithAnimation}
        >
          <View style={styles.swipeHandle} />
        </TouchableOpacity>
      )}

      {!embedded && !stacked && (
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>{addressModalTitle}</ThemedText>
        </View>
      )}

      <View style={styles.companyInfo}>
        <ThemedText
          lightColor="#80818B"
          darkColor="#FBFCFF80"
          numberOfLines={1}
          style={styles.companyName}
        >
          {currentCompany?.name || "Выберите компанию"}
        </ThemedText>
      </View>

      <ScrollView
        style={[
          styles.addressesContainer,
          (embedded || stacked) && styles.addressesContainerEmbedded,
          stacked && styles.addressesContainerStacked,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#203686" />
          </View>
        ) : deliveryAddresses.length > 0 ? (
          deliveryAddresses.map((address: any, index: number) => (
            <TouchableOpacity
              key={address.id || index}
              style={[
                styles.addressItem,
                isDarkMode && {
                  borderBottomColor: "#323235",
                },
              ]}
              onPress={() => handleSelectAddress(address)}
            >
              <View
                style={[
                  styles.radioOuter,
                  effectiveSelectedId === address.id &&
                    styles.radioOuterSelected,
                  isDarkMode &&
                    effectiveSelectedId === address.id && {
                      borderColor: "#4C94FF",
                    },
                ]}
              >
                {effectiveSelectedId === address.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.addressInfo}>
                <ThemedText numberOfLines={2} style={styles.addressText}>
                  {address.address}
                  {address.entrance && `, под. ${address.entrance}`}
                  {address.floor && `, эт. ${address.floor}`}
                  {address.apartment && `, кв. ${address.apartment}`}
                </ThemedText>
                {address?.comment ?
                <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" numberOfLines={1} style={styles.underAddressText}>
                  {address.comment && address.comment}
                </ThemedText>
                 : null}
              </View>
              <ArrowIconRight />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Нет сохраненных адресов
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.buttonsContainer,
          { paddingBottom: buttonsBottomPadding },
        ]}
      >
        <PrimaryButton
          title="Добавить адрес доставки"
          onPress={() => setShowAddAddressModal(true)}
          variant="primary"
          size="md"
          loading={false}
          activeOpacity={0.8}
          fullWidth
        />

        <View style={styles.buttonSpacer} />

        <PrimaryButton
          title="Выбрать другую компанию"
          onPress={() => setShowCompanyModal(true)}
          variant="third"
          size="md"
          loading={false}
          activeOpacity={0.8}
          fullWidth
        />
      </View>
    </>
  );

  const childOverlays = (
    <>
      {showCompanyModal && (
        <View style={styles.embeddedOverlay}>
          <CompanySelectModal
            embedded={embedded || stacked}
            visible
            onClose={() => setShowCompanyModal(false)}
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={handleSelectCompany}
            onAddCompany={onAddCompany}
          />
        </View>
      )}

      {(embedded || stacked) && showAddAddressModal && currentCompany?.id ? (
        <View style={styles.embeddedOverlay}>
          <AddAddressFormPanel
            companyId={currentCompany.id}
            onBack={() => setShowAddAddressModal(false)}
            onSuccess={handleAddressAdded}
          />
        </View>
      ) : (
        <AddAddressModal
          visible={showAddAddressModal}
          onClose={() => setShowAddAddressModal(false)}
          onSuccess={handleAddressAdded}
          companyId={currentCompany?.id}
        />
      )}
    </>
  );

  if (stacked) {
    return (
      <>
        <AnimatedStackedSheet
          visible={visible}
          onClose={closeModalWithAnimation}
          contentHorizontalPadding={0}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{addressModalTitle}</ThemedText>
          </View>
          {addressList}
        </AnimatedStackedSheet>
        {(showCompanyModal || showAddAddressModal) && (
          <View style={styles.stackedChildOverlay}>{childOverlays}</View>
        )}
      </>
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
          title={addressModalTitle}
          showBackButton
          onBackPress={closeModalWithAnimation}
        />
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.embeddedContent}
        >
          {addressList}
        </ThemedView>
        {childOverlays}
      </ThemedView>
    );
  }

  return (
    <AppModal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={closeModalWithAnimation}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={closeModalWithAnimation}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                isDarkMode && {
                  backgroundColor: "#202022",
                },
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              {addressList}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      {childOverlays}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  embeddedRoot: {
    flex: 1,
  },
  embeddedContent: {
    flex: 1,
    marginTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  embeddedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  stackedChildOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  addressesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "50%",
  },
  addressesContainerEmbedded: {
    flex: 1,
    maxHeight: undefined,
  },
  addressesContainerStacked: {
    maxHeight: 320,
  },
  companyInfo: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "500",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  underAddressText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBFCFF",
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#80818B",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    // gap: 8,
  },
  buttonSpacer: {
    height: 8,
  },
});
