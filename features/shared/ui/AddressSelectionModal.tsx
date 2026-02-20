// features/shared/ui/AddressSelectionModal.tsx
import { ArrowIconRight } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { CompanySelectionModal } from './CompanySelectionModalSmall';
import { PrimaryButton } from './components/PrimartyButton';

const { height: screenHeight } = Dimensions.get('window');

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
  onAddAddress: () => void;
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
  onAddAddress,
}) => {
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isClosing, setIsClosing] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

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

  const handleSelectAddress = (address: any) => {
    onSelectAddress(address);
    closeModalWithAnimation();
  };

  const handleSelectCompany = (company: any) => {
    onSelectCompany(company);
    setShowCompanyModal(false);
  };

  const handleAddAddress = () => {
    closeModalWithAnimation();
    setTimeout(() => {
      onAddAddress();
    }, 300);
  };

  const deliveryAddresses = currentCompany?.deliveryAddresses || [];

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModalWithAnimation}
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.modalContainer,
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
                  <ThemedText style={styles.modalTitle}>Выберите адрес доставки</ThemedText>
                  <TouchableOpacity onPress={closeModalWithAnimation}>
                    {/* Можно добавить иконку закрытия если нужно */}
                  </TouchableOpacity>
                </View>

                {/* Блок с текущей компанией (как в CompanySelectionModal) */}
            
                  <View style={styles.companyInfo}>
                    <ThemedText lightColor='#80818B' numberOfLines={1} style={styles.companyName}>
                      {currentCompany?.name || 'Выберите компанию'}
                    </ThemedText>
                  </View>

                {/* Список адресов */}
                <ScrollView 
                  style={styles.addressesContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {deliveryAddresses.map((address: any, index: number) => (
                    <TouchableOpacity
                      key={address.id || index}
                      style={styles.addressItem}
                      onPress={() => handleSelectAddress(address)}
                    >
                      <View style={[
                        styles.radioOuter,
                        selectedAddressId === address.id && styles.radioOuterSelected
                      ]}>
                        {selectedAddressId === address.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View style={styles.addressInfo}>
                        <ThemedText numberOfLines={2} style={styles.addressText}>
                          {address.address}
                        </ThemedText>
                      </View>
                      <ArrowIconRight/>
                    </TouchableOpacity>
                  ))}

                  {deliveryAddresses.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <ThemedText style={styles.emptyText}>
                        Нет сохраненных адресов
                      </ThemedText>
                    </View>
                  )}
                </ScrollView>

                {/* Кнопки внизу как в CompanySelectionModal */}
                <View style={styles.buttonsContainer}>
                  <PrimaryButton
                    title="Добавить адрес доставки"
                    onPress={handleAddAddress}
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
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Модалка выбора компании */}
      <CompanySelectionModal
        visible={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={handleSelectCompany}
        onAddCompany={onAddCompany}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B1C',
  },
  addressesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: '50%',
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  companyIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfo: {
    paddingHorizontal: 20
    // flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B1B1C',
    lineHeight: 22,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8DADE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFCFF',
  },
  radioOuterSelected: {
    borderColor: '#203686',
    borderWidth: 5,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#80818B',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  buttonSpacer: {
    height: 8,
  },
});