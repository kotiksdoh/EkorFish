import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { addDeliveryAddress } from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedTextInput from "./components/CustomInput";
import { PrimaryButton } from "./components/PrimartyButton";

type AddressForm = {
  address: string;
  apartment: string;
  floor: string;
  entrance: string;
  intercom: string;
  comment: string;
};

type Props = {
  companyId: string;
  onBack: () => void;
  onSuccess: (address: any) => void;
};

export function AddAddressFormPanel({ companyId, onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    setFormData({
      address: "",
      apartment: "",
      floor: "",
      entrance: "",
      intercom: "",
      comment: "",
    });
  }, [companyId]);

  const handleSave = async () => {
    if (!formData.address.trim() || !companyId) return;

    try {
      const result = await dispatch(
        addDeliveryAddress({
          companyId,
          addressData: {
            address: formData.address,
            apartment: formData.apartment || null,
            floor: formData.floor || null,
            entrance: formData.entrance || null,
            intercom: formData.intercom || null,
            comment: formData.comment || null,
          },
        }),
      );

      if (addDeliveryAddress.fulfilled.match(result) && result.payload) {
        onSuccess(result.payload);
      }
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  return (
    <ThemedView
      lightColor="#FFFFFF"
      darkColor="#151516"
      style={styles.root}
    >
      <ModalHeader title="Новый адрес" showBackButton onBackPress={onBack} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText
            style={styles.contentTitle}
            lightColor="#1B1B1C"
            darkColor="#F2F4F7"
          >
            Введите адрес доставки
          </ThemedText>

          <View style={styles.formContainer}>
            <AnimatedTextInput
              placeholder="Адрес *"
              value={formData.address}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, address: value }))
              }
            />
            <View style={styles.rowFields}>
              <View style={styles.halfWidthField}>
                <AnimatedTextInput
                  placeholder="Квартира"
                  value={formData.apartment}
                  onChangeText={(value) =>
                    setFormData((prev) => ({ ...prev, apartment: value }))
                  }
                />
              </View>
              <View style={styles.halfWidthField}>
                <AnimatedTextInput
                  placeholder="Этаж"
                  value={formData.floor}
                  onChangeText={(value) =>
                    setFormData((prev) => ({ ...prev, floor: value }))
                  }
                />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={styles.halfWidthField}>
                <AnimatedTextInput
                  placeholder="Подъезд"
                  value={formData.entrance}
                  onChangeText={(value) =>
                    setFormData((prev) => ({ ...prev, entrance: value }))
                  }
                />
              </View>
              <View style={styles.halfWidthField}>
                <AnimatedTextInput
                  placeholder="Домофон"
                  value={formData.intercom}
                  onChangeText={(value) =>
                    setFormData((prev) => ({ ...prev, intercom: value }))
                  }
                />
              </View>
            </View>
            <AnimatedTextInput
              placeholder="Комментарий"
              value={formData.comment}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, comment: value }))
              }
              multiline
              style={styles.commentInputWrap}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  formContainer: {
    gap: 16,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidthField: {
    flex: 1,
  },
  commentInputWrap: {
    minHeight: 80,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E8E8E8",
  },
});
