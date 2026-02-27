// features/shared/ui/CompanySelectionModal.tsx
import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import { PrimaryButton } from "./components/PrimartyButton";

const { height: screenHeight } = Dimensions.get("window");

interface CompanySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  companies: any[];
  selectedCompanyId?: string;
  onSelectCompany: (company: any) => void;
  onAddCompany: () => void;
}

export const CompanySelectionModal: React.FC<CompanySelectionModalProps> = ({
  visible,
  onClose,
  companies,
  selectedCompanyId,
  onSelectCompany,
  onAddCompany,
}) => {
  const colorScheme = useColorScheme();
  //TODO
  const isDarkMode = colorScheme === "dark";
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isClosing, setIsClosing] = useState(false);

  // Анимация появления
  useEffect(() => {
    if (visible) {
      modalTranslateY.setValue(screenHeight);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    } else {
      modalTranslateY.setValue(screenHeight);
    }
  }, [visible]);

  const closeModalWithAnimation = () => {
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

  const handleOverlayPress = () => {
    if (!isClosing) {
      closeModalWithAnimation();
    }
  };

  const handleSelectCompany = (company: any) => {
    onSelectCompany(company);
    closeModalWithAnimation();
  };

  const handleAddCompany = () => {
    closeModalWithAnimation();
    // Небольшая задержка, чтобы модалка закрылась перед открытием новой
    setTimeout(() => {
      onAddCompany();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={closeModalWithAnimation}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                isDarkMode && {
                  backgroundColor: '#202022'
                },
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              {/* Защелка для свайпа */}
              <TouchableOpacity
                style={styles.swipeHandleContainer}
                activeOpacity={0.7}
                onPress={closeModalWithAnimation}
              >
                <View style={styles.swipeHandle} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  Выберите компанию
                </ThemedText>
                <TouchableOpacity onPress={closeModalWithAnimation}>
                  {/* Можно добавить иконку закрытия если нужно */}
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.companiesContainer}
                showsVerticalScrollIndicator={false}
              >
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[styles.companyItem, isDarkMode && {
                      borderColor: '#323235'
                    }]}
                    onPress={() => handleSelectCompany(company)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selectedCompanyId === company.id &&
                          styles.radioOuterSelected,
                          isDarkMode && selectedCompanyId === company.id && {
                            borderColor:'#4C94FF'
                          }
                      ]}
                    >
                      {selectedCompanyId === company.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.companyInfo}>
                      <ThemedText
                        numberOfLines={1}
                        style={[
                          styles.companyName,
                          // selectedCompanyId === company.id && styles.companyTextSelected
                        ]}
                      >
                        {company.name}
                      </ThemedText>
                    </View>
                    <ArrowIconRight />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Кнопка добавления компании */}
              {/* <View style={styles.addButtonContainer}>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddCompany}
                >
                  <ThemedText style={styles.addButtonText}>
                    
                  </ThemedText>
                </TouchableOpacity>
              </View> */}
              <View style={styles.addButtonContainer}>
                <PrimaryButton
                  title="+ Добавить компанию"
                  onPress={handleAddCompany}
                  variant="third"
                  size="md"
                  loading={false}
                  activeOpacity={0.8}
                  fullWidth
                />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    // paddingBottom: 20
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
    fontSize: 18,
    fontWeight: "600",
    color: "#1B1B1C",
  },
  companiesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "60%",
  },
  companyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 8,
  },
  companyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  companyRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#203686",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1B1B1C",
    marginBottom: 4,
  },
  companyInn: {
    fontSize: 14,
    color: "#80818B",
  },
  companyTextSelected: {
    fontWeight: "600",
    color: "#203686",
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addButton: {
    backgroundColor: "#203686",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#FBFCFF",
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
});
