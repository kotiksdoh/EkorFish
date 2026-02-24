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
    ActivityIndicator,
} from 'react-native';
import { CompanySelectModal } from './CompanySelectModal';
import { PrimaryButton } from './components/PrimartyButton';
import { AddAddressModal } from './AddAddressModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getCompanyAddresses } from '@/features/catalog/catalogSlice';
import { saveSelectedAddress, getSavedAddress } from '@/features/shared/services/addressStorage';

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
    onAddressAdded?: () => void;
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
}) => {
    const dispatch = useAppDispatch();
    const [modalTranslateY] = useState(new Animated.Value(screenHeight));
    const [isClosing, setIsClosing] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [localAddresses, setLocalAddresses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [savedAddressId, setSavedAddressId] = useState<string | null>(null);

    // Загружаем адреса и сохраненный адрес при открытии модалки или смене компании
    useEffect(() => {
        if (visible && currentCompany?.id) {
            loadAddresses();
            loadSavedAddress();
        }
    }, [visible, currentCompany?.id]);

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
            console.error('Error loading addresses:', error);
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleSelectAddress = async (address: any) => {
        // Сохраняем выбранный адрес в AsyncStorage
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

    const handleAddressAdded = async () => {
        // Перезагружаем адреса после добавления нового
        await loadAddresses();
        if (onAddressAdded) {
            onAddressAdded();
        }
    };

    // Определяем, какой адрес показывать как выбранный
    const effectiveSelectedId = selectedAddressId || savedAddressId;

    const deliveryAddresses = localAddresses.length > 0 ? localAddresses : currentCompany?.deliveryAddresses || [];

    return (
        <>
            <Modal
                visible={visible}
                animationType="none"
                transparent={true}
                onRequestClose={closeModalWithAnimation}
            >
                <TouchableWithoutFeedback onPress={closeModalWithAnimation}>
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
                                </View>

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
                                    {isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color="#203686" />
                                        </View>
                                    ) : deliveryAddresses.length > 0 ? (
                                        deliveryAddresses.map((address: any, index: number) => (
                                            <TouchableOpacity
                                                key={address.id || index}
                                                style={styles.addressItem}
                                                onPress={() => handleSelectAddress(address)}
                                            >
                                                <View style={[
                                                    styles.radioOuter,
                                                    effectiveSelectedId === address.id && styles.radioOuterSelected
                                                ]}>
                                                    {effectiveSelectedId === address.id && (
                                                        <View style={styles.radioInner} />
                                                    )}
                                                </View>
                                                <View style={styles.addressInfo}>
                                                    <ThemedText numberOfLines={2} style={styles.addressText}>
                                                        {address.address}
                                                        {address.apartment && `, кв. ${address.apartment}`}
                                                        {address.entrance && `, под. ${address.entrance}`}
                                                    </ThemedText>
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

                                {/* Кнопки внизу */}
                                <View style={styles.buttonsContainer}>
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
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <CompanySelectModal
                visible={showCompanyModal}
                onClose={() => setShowCompanyModal(false)}
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={handleSelectCompany}
                onAddCompany={onAddCompany}
            />

            <AddAddressModal
                visible={showAddAddressModal}
                onClose={() => setShowAddAddressModal(false)}
                onSuccess={handleAddressAdded}
                companyId={currentCompany?.id}
            />
        </>
    );
};

// Стили остаются без изменений
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
    companyInfo: {
        paddingHorizontal: 20,
        marginBottom: 8,
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
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
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