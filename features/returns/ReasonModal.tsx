// components/ReasonModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import React, { useState } from "react";
import {
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface ReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reasonId: number, comment: string) => void;
  selectedReasonId?: number;
  selectedComment?: string;
  reasons: Array<{ reason: number; name: string }>;
}

export const ReasonModal: React.FC<ReasonModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedReasonId,
  selectedComment,
  reasons,
}) => {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";
  const [selectedReason, setSelectedReason] = useState<number | undefined>(selectedReasonId);
  const [comment, setComment] = useState(selectedComment || "");

  const handleSelect = () => {
    if (selectedReason !== undefined) {
      onSelect(selectedReason, comment);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedReason(selectedReasonId);
    setComment(selectedComment || "");
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Причина возврата"
          subTitle="Выберите причину возврата товара"
          showBackButton={false}
          showCloseButton={true}
          onBackPress={handleClose}
        />

        <View style={styles.content}>
          <View style={styles.reasonsList}>
            {reasons?.map((reason) => (
              <TouchableOpacity
                key={reason.reason}
                style={[
                  styles.reasonItem,
                  isDark && styles.reasonItemDark,
                ]}
                onPress={() => setSelectedReason(reason.reason)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedReason === reason.reason && styles.radioOuterSelected,
                    isDark && selectedReason === reason.reason && styles.radioOuterSelectedDark,
                  ]}
                >
                  {selectedReason === reason.reason && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText
                  style={[
                    styles.reasonName,
                    selectedReason === reason.reason && styles.reasonNameSelected,
                  ]}
                  lightColor="#202022"
                  darkColor="#F2F4F7"
                >
                  {reason.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Комментарий всегда отображается */}
          <View style={styles.commentContainer}>
            <ThemedText
              style={styles.commentLabel}
              lightColor="#202022"
              darkColor="#F2F4F7"
            >
              Комментарий
            </ThemedText>
            <TextInput
              style={[
                styles.commentInput,
                isDark && styles.commentInputDark,
              ]}
              placeholder="Опишите причину подробнее..."
              placeholderTextColor="#80818B"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedReason === undefined && styles.submitButtonDisabled,
            ]}
            disabled={selectedReason === undefined}
            onPress={handleSelect}
          >
            <ThemedText style={styles.submitButtonText}>
              Выбрать
            </ThemedText>
          </TouchableOpacity>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  reasonItemDark: {
    borderBottomColor: "#323235",
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
  radioOuterSelectedDark: {
    borderColor: "#4C94FF",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  reasonName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  reasonNameSelected: {
    color: "#203686",
  },
  commentContainer: {
    marginTop: 16,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  commentInputDark: {
    backgroundColor: "#151516",
    borderColor: "#252527",
    color: "#F2F4F7",
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "transparent",
  },
  submitButton: {
    backgroundColor: "#203686",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});