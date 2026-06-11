import { Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AddAddressFormPanel } from "./AddAddressFormPanel";

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (address?: any) => void;
  companyId: string;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  visible,
  onClose,
  onSuccess,
  companyId,
}) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
        <AddAddressFormPanel
          companyId={companyId}
          onBack={onClose}
          onSuccess={(address) => {
            onSuccess(address);
          }}
        />
      </SafeAreaProvider>
    </Modal>
  );
};
