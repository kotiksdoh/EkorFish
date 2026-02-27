// features/shared/ui/AddAddressModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { addDeliveryAddress } from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import AnimatedTextInput from "./components/CustomInput";
import { PrimaryButton } from "./components/PrimartyButton";

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

interface AddressForm {
  address: string;
  apartment: string;
  floor: string;
  entrance: string;
  intercom: string;
  comment: string;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  visible,
  onClose,
  onSuccess,
  companyId,
}) => {
  const dispatch = useAppDispatch();
  const isAddingAddress = useAppSelector(
    (state) => state.catalog.isAddingAddress,
  );

  const [formData, setFormData] = useState<AddressForm>({
    address: "",
    apartment: "",
    floor: "",
    entrance: "",
    intercom: "",
    comment: "",
  });

  // Очищаем форму при закрытии
  useEffect(() => {
    if (!visible) {
      setFormData({
        address: "",
        apartment: "",
        floor: "",
        entrance: "",
        intercom: "",
        comment: "",
      });
    }
  }, [visible]);

  const handleSave = async () => {
    if (!formData.address.trim() || !companyId) {
      return;
    }

    try {
      const payload = {
        address: formData.address,
        apartment: formData.apartment || null,
        floor: formData.floor || null,
        entrance: formData.entrance || null,
        intercom: formData.intercom || null,
        comment: formData.comment || null,
      };

      const result = await dispatch(
        addDeliveryAddress({
          companyId,
          addressData: payload,
        }),
      );

      if (addDeliveryAddress.fulfilled.match(result)) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

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
          title="Новый адрес"
          showBackButton={true}
          onBackPress={onClose}
        />

        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.content}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <ThemedText style={styles.contentTitle}>
                Введите адрес доставки
              </ThemedText>

              <View style={styles.formContainer}>
                {/* Адрес - полная ширина */}
                <View style={styles.fullWidthField}>
                  <AnimatedTextInput
                    placeholder="Адрес *"
                    placeholderTextColor="#80818B"
                    value={formData.address}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, address: value }))
                    }
                  />
                </View>

                {/* Квартира и Этаж - в ряд */}
                <View style={styles.rowFields}>
                  <View style={styles.halfWidthField}>
                    <AnimatedTextInput
                      placeholder="Квартира"
                      placeholderTextColor="#80818B"
                      value={formData.apartment}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, apartment: value }))
                      }
                    />
                  </View>
                  <View style={styles.halfWidthField}>
                    <AnimatedTextInput
                      placeholder="Этаж"
                      placeholderTextColor="#80818B"
                      value={formData.floor}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, floor: value }))
                      }
                    />
                  </View>
                </View>

                {/* Подъезд и Домофон - в ряд */}
                <View style={styles.rowFields}>
                  <View style={styles.halfWidthField}>
                    <AnimatedTextInput
                      placeholder="Подъезд"
                      placeholderTextColor="#80818B"
                      value={formData.entrance}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, entrance: value }))
                      }
                    />
                  </View>
                  <View style={styles.halfWidthField}>
                    <AnimatedTextInput
                      placeholder="Домофон"
                      placeholderTextColor="#80818B"
                      value={formData.intercom}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, intercom: value }))
                      }
                    />
                  </View>
                </View>

                {/* Комментарий - полная ширина */}
                <View style={styles.fullWidthField}>
                  <AnimatedTextInput
                    placeholder="Комментарий"
                    placeholderTextColor="#80818B"
                    value={formData.comment}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, comment: value }))
                    }
                    style={styles.commentInput}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ThemedView>

        {/* Кнопка внизу как в CompanySelectModal */}
        <View style={styles.footer}>
          <PrimaryButton
            title="Сохранить адрес"
            onPress={handleSave}
            variant="primary"
            size="md"
            loading={isAddingAddress}
            disabled={!formData.address.trim() || !companyId || isAddingAddress}
            fullWidth
          />
        </View>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  content: {
    marginTop: 16,
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1B1B1C",
  },
  formContainer: {
    gap: 16,
  },
  fullWidthField: {
    width: "100%",
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  halfWidthField: {
    flex: 1,
  },
  commentInput: {
    // textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
  },
});
