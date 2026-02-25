import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getMyInfo, getTowns, updateUserTown } from '@/features/auth/authSlice';

const { height: screenHeight } = Dimensions.get('window');

interface TownSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  storageId: string;
  onTownSelected: (selectedStorageId: string) => void;
}

export const TownSelectionModal: React.FC<TownSelectionModalProps> = ({
  visible,
  onClose,
  storageId,
  onTownSelected,
}) => {
  const dispatch = useAppDispatch();
  const towns = useAppSelector((state) => state.auth.towns);
  const isLoadingTowns = useAppSelector((state) => state.auth.isLoadingTowns);
  const me = useAppSelector((state) => state.auth.me);
  
  const [selectedTownId, setSelectedTownId] = useState<string | null>(
    me?.storageId || null
  );
  const [isUpdating, setIsUpdating] = useState(false);
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
      
      // Загружаем города при открытии модалки
      dispatch(getTowns());
    } else {
      modalTranslateY.setValue(screenHeight);
    }
  }, [visible, dispatch]);

  // Устанавливаем выбранный город при загрузке
  useEffect(() => {
    if (me?.townId) {
      setSelectedTownId(me.townId);
    }
  }, [me]);

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

  const handleTownSelect = (townId: string) => {
    setSelectedTownId(townId);
  };

  const handleApplyPress = async () => {
    if (!selectedTownId) return;
    
    setIsUpdating(true);
    
    try {
      await dispatch(updateUserTown({
        storageId: selectedTownId,
        // townId: selectedTownId,
      })).then((res) =>
        dispatch(getMyInfo(""))
      )
      
      // Закрываем модалку после успешного обновления
      setTimeout(() => {
        closeModalWithAnimation();
        if (onTownSelected) {
          onTownSelected(selectedTownId);
        }
      }, 300);
    } catch (error) {
      console.error('Error updating town:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
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
                <ThemedText style={styles.modalTitle}>Укажите город</ThemedText>
              </View>

              <ScrollView 
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingTowns ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#203686" />
                    <ThemedText style={styles.loadingText}>
                      Загрузка городов...
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    {towns.map((town) => (
                      <TouchableOpacity
                        key={town.id}
                        style={styles.townItem}
                        onPress={() => handleTownSelect(town.id)}
                        disabled={isUpdating}
                      >
                        <View style={styles.townItemContent}>
                          <View style={[
                            styles.radioOuter,
                            selectedTownId === town.id && styles.radioOuterSelected
                          ]}>
                            {selectedTownId === town.id && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                          <ThemedText style={styles.townName}>
                            {town.value}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {towns.length === 0 && !isLoadingTowns && (
                      <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyText}>
                          Города не найдены
                        </ThemedText>
                      </View>
                    )}
                  </>
                )}
                
                <View style={styles.modalBottomSpacer} />
              </ScrollView>

              {/* Кнопка Применить */}
              <View style={styles.applyButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.applyButton,
                    (!selectedTownId || isUpdating) && styles.applyButtonDisabled
                  ]}
                  onPress={handleApplyPress}
                  disabled={!selectedTownId || isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.applyButtonText}>
                      Применить
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              {/* Оверлей загрузки (убираем, так как теперь индикатор в кнопке) */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '80%',
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
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B1C',
  },
  modalCloseText: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    color: '#80818B',
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalBottomSpacer: {
    height: 80, // Увеличил отступ для кнопки
  },
  townItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  townItemContent: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  townName: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    color: '#1B1B1C',
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#80818B',
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
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  updatingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#203686',
    fontWeight: '600',
  },
  // Новые стили для кнопки Применить
  applyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  applyButton: {
    backgroundColor: '#203686',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.5,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
  },
});