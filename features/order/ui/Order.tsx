// app/modals/checkout.tsx
import { ArrowIconRight, IconCompany, TrashIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { selectCompany, getTowns, updateUserTown } from '@/features/auth/authSlice';
import { ModalHeader } from '@/features/auth/ui/Header';
import { createOrder, createRecipient, createRecipients, deleteRecipient, getOrderPageData, getRecipients } from '@/features/catalog/catalogSlice';
import { PrimaryButton } from '@/features/home';
import { baseUrl } from '@/features/shared/services/axios';
import { useSavedAddress } from '@/features/shared/services/useSavedAddress';
import { AddressSelectionModal } from '@/features/shared/ui/AddressSelectionModal';
import { CompanySelectionModal } from '@/features/shared/ui/CompanySelectionModalSmall';
import { CustomCheckbox } from '@/features/shared/ui/components/CustomCheckBox';
import AnimatedTextInput from '@/features/shared/ui/components/CustomInput';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

// Енумы из бекенда
enum DeliveryMethod {
  Delivery = 0,
  Pickup = 1
}

enum PaymentType {
  Cashless = 0,
  Cash = 1
}

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  selectedItems: Set<string>;
  cartItems: any[];
  totals: {
    totalItems: number;
    totalPrice: number;
    totalWeight: number;
  };
}

interface Recipient {
  id: string;
  fullname: string;
  phoneNumber: string;
  email: string;
  deliveryAddressId?: string;
  isExisting?: boolean; // флаг для существующих получателей с бекенда
}

interface DateTimeSelection {
  date: string;
  time: string;
}

export default function CheckoutModal({
  visible,
  onClose,
  selectedItems,
  cartItems,
  totals
}: CheckoutModalProps) {
  // Состояние для выбранных значений
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod>(DeliveryMethod.Delivery);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('');
  const [selectedDateTime, setSelectedDateTime] = useState<DateTimeSelection>({ date: '', time: '' });
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>(PaymentType.Cashless);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', fullname: '', phoneNumber: '', email: '' }
  ]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const dispatch = useAppDispatch();
  const tabContainerRef = useRef<View>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  
  // Данные с бекенда
  const orderData = useAppSelector((state) => state.catalog.order);
  const deliveryMethods = orderData?.deliveryMethods || [];
  const towns = useAppSelector((state) => state.auth.towns);
  const isLoadingTowns = useAppSelector((state) => state.auth.isLoadingTowns);
  const savedRecipients = useAppSelector((state) => state.catalog.recipients);
  const isLoadingRecipients = useAppSelector((state) => state.catalog.isLoadingRecipients);
  const isCreatingOrder = useAppSelector((state) => state.catalog.isCreatingOrder);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const me = useAppSelector((state) => state.auth.me);

  // Получаем доступные способы оплаты для текущего метода доставки
  const getAvailablePaymentTypes = (method: DeliveryMethod): PaymentType[] => {
    const methodConfig = deliveryMethods.find((m: any) => m.method === method);
    return methodConfig?.availablePaymentTypes || [];
  };

  // Проверяем, доступен ли метод доставки
  const isMethodAvailable = (method: DeliveryMethod): boolean => {
    return deliveryMethods.some((m: any)=> m.method === method);
  };
  const handlePickTown = async(id: any) => {
    await dispatch(updateUserTown({
      storageId: id,
      // townId: selectedTownId,
    })).unwrap();
    setSelectedPickupAddress(id)
  }
  // Получаем название способа оплаты для отображения
  const getPaymentTypeDisplayName = (type: PaymentType): string => {
    switch (type) {
      case PaymentType.Cashless:
        return 'Безналичный расчёт';
      case PaymentType.Cash:
        return 'Наличными';
      default:
        return '';
    }
  };

  // Загружаем данные при открытии модалки
  useEffect(() => {
    if (visible) {
      loadOrderData();
      dispatch(getTowns());
    }
  }, [visible]);

  // Загружаем получателей при выборе адреса
  useEffect(() => {
    if (selectedAddress?.id) {
      loadRecipients(selectedAddress.id);
    }
  }, [selectedAddress]);

  // Обновляем способ оплаты при смене метода доставки
  useEffect(() => {
    const availableTypes = getAvailablePaymentTypes(selectedMethod);
    if (availableTypes.length > 0 && !availableTypes.includes(selectedPaymentType)) {
      setSelectedPaymentType(availableTypes[0]);
    }
  }, [selectedMethod]);

  // Устанавливаем ближайшую дату и время при загрузке данных
  useEffect(() => {
    if (orderData?.nearestDeliveryDate && !selectedDateTime.date) {
      const nearestDate = new Date(orderData.nearestDeliveryDate);
      const timeSlots = getTimeSlotsForDate(nearestDate, orderData?.deliverySchedule);
      const nearestTime = timeSlots.length > 0 ? formatTimeForDisplay(timeSlots[0]) : '';
      
      setSelectedDateTime({
        date: nearestDate.toDateString(),
        time: nearestTime
      });
    }
  }, [orderData]);

  // Инициализируем получателей из сохраненных
  useEffect(() => {
    if (savedRecipients && savedRecipients.length > 0) {
      const formattedRecipients = savedRecipients.map((r: any) => ({
        id: r.id,
        fullname: r.fullname || '',
        phoneNumber: r.phoneNumber || '',
        email: r.email || '',
        deliveryAddressId: r.deliveryAddressId,
        isExisting: true
      }));
      setRecipients(formattedRecipients);
    }
  }, [savedRecipients]);

  const loadOrderData = async () => {
    try {
      await dispatch(getOrderPageData()).unwrap();
    } catch (error) {
      console.error('Error loading order data:', error);
    }
  };

  const loadRecipients = async (addressId: string) => {
    try {
      await dispatch(getRecipients(addressId)).unwrap();
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const handleSelectCompany = (company: any) => {
    dispatch(selectCompany(company));
    setSelectedAddress(null);
  };

  const { savedAddress, saveAddress } = useSavedAddress(currentCompany?.id);

  useEffect(() => {
    if (currentCompany?.id && savedAddress) {
      setSelectedAddress(savedAddress);
    }
  }, [currentCompany?.id, savedAddress]);

  const handleSelectAddress = async (address: any) => {
    setSelectedAddress(address);
    if (currentCompany?.id) {
      await saveAddress(address);
    }
  };

  const handleAddCompany = () => {
    setShowAddressModal(false);
    setTimeout(() => {
      // открыть модалку регистрации компании
    }, 300);
  };

  const handleMethodChange = (method: DeliveryMethod) => {
    setSelectedMethod(method);
    
    const tabIndex = method === DeliveryMethod.Delivery ? 0 : 1;
    Animated.spring(indicatorPosition, {
      toValue: tabIndex * tabContainerWidth,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
      stiffness: 120
    }).start();
  };

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      fullname: '',
      phoneNumber: '',
      email: '',
    };
    setRecipients([...recipients, newRecipient]);
  };

  const removeRecipient = async (id: string) => {
    const recipient = recipients.find(r => r.id === id);
    
    // Если получатель существовал на бекенде, удаляем его
    if (recipient?.isExisting && recipient.id) {
      try {
        await dispatch(deleteRecipient(recipient.id)).unwrap();
      } catch (error) {
        console.error('Error deleting recipient:', error);
      }
    }
    
    if (recipients.length > 1) {
      setRecipients(recipients.filter(r => r.id !== id));
    }
  };

  const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleDateTimeConfirm = (dateTime: DateTimeSelection) => {
    setSelectedDateTime(dateTime);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const days = [
      'воскресенье', 'понедельник', 'вторник', 'среда', 
      'четверг', 'пятница', 'суббота'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  const formatDateTimeDisplay = () => {
    if (selectedDateTime.date && selectedDateTime.time) {
      return `${formatDateDisplay(selectedDateTime.date)} ${selectedDateTime.time}`;
    }
    
    if (orderData?.nearestDeliveryDate) {
      const nearestDate = new Date(orderData.nearestDeliveryDate);
      const timeSlots = getTimeSlotsForDate(nearestDate, orderData?.deliverySchedule);
      const nearestTime = timeSlots.length > 0 ? formatTimeForDisplay(timeSlots[0]) : '';
      return `${formatDateDisplay(nearestDate.toDateString())} ${nearestTime}`;
    }
    
    return 'Выберите дату и время';
  };

  // Валидация получателей
  const validateRecipients = (): boolean => {
    // Проверяем основного получателя (первый в списке)
    const mainRecipient = recipients[0];
    if (!mainRecipient.fullname.trim() || !mainRecipient.phoneNumber.trim() || !mainRecipient.email.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля основного получателя');
      return false;
    }

    // Проверяем дополнительных получателей
    for (let i = 1; i < recipients.length; i++) {
      const recipient = recipients[i];
      // Если хоть одно поле заполнено, проверяем все
      if (recipient.fullname.trim() || recipient.phoneNumber.trim() || recipient.email.trim()) {
        if (!recipient.fullname.trim() || !recipient.phoneNumber.trim() || !recipient.email.trim()) {
          Alert.alert('Ошибка', `Заполните все поля дополнительного получателя ${i}`);
          return false;
        }
      }
    }

    return true;
  };

  // Подготовка данных для создания заказа
  const prepareOrderData = () => {
    // Форматируем дату в ISO строку
    const date = new Date(selectedDateTime.date);
    const [hours, minutes] = selectedDateTime.time.split(' – ')[0].split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    
    const deliveryDate = date.toISOString();

    // Подготавливаем продукты
    const products = selectedCartItems.map(item => ({
      productId: item.productId,
      purchaseOptionId: item.productPurchaseOptionId,
      quantity: item.quantity
    }));

    // Подготавливаем userInfo
    const userInfo: any = {
      companyId: currentCompany?.id,
      deliveryAddressId: selectedAddress?.id
    };

    // Если нет компаний, используем individualProfileId
    if (me?.companies?.length === 0 && me?.individualProfile?.id) {
      userInfo.individualProfileId = me.individualProfile.id;
      delete userInfo.companyId;
    }

    return {
      deliveryMethod: selectedMethod,
      deliveryDate,
      paymentType: selectedPaymentType,
      notificationEnabled: notificationsEnabled,
      userInfo,
      products
    };
  };

  // Создание получателей
  const createRecipientsForOrder = async () => {
    if (!selectedAddress?.id) return false;
  
    // Фильтруем только заполненных получателей, которых еще нет на бекенде
    const recipientsToCreate = recipients
      .filter(r => r.fullname.trim() || r.phoneNumber.trim() || r.email.trim())
      .filter(r => !r.isExisting); // Не создаем тех, кто уже есть
  
    if (recipientsToCreate.length === 0) return true;
  
    // Показываем индикатор загрузки
    // setIsCreatingRecipients(true);
  
    try {
      // Отправляем запрос для каждого получателя отдельно
      for (const recipient of recipientsToCreate) {
        const recipientData = {
          fullname: recipient.fullname.trim(),
          phoneNumber: recipient.phoneNumber.trim(),
          email: recipient.email.trim()
        };
  
        await dispatch(createRecipient({
          deliveryAddressId: selectedAddress.id,
          recipientData
        })).unwrap();
        
        // Небольшая задержка между запросами, чтобы не перегружать сервер
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // После создания всех получателей, перезагружаем список
      await dispatch(getRecipients(selectedAddress.id)).unwrap();
      
      return true;
    } catch (error) {
      console.error('Error creating recipients:', error);
      Alert.alert('Ошибка', 'Не удалось создать получателей');
      return false;
    } finally {
      // setIsCreatingRecipients(false);
    }
  };

  // Оформление заказа
  const handleCreateOrder = async () => {
    // Валидация
    if (!selectedAddress && selectedMethod === DeliveryMethod.Delivery) {
      Alert.alert('Ошибка', 'Выберите адрес доставки');
      return;
    }

    if (!selectedDateTime.date || !selectedDateTime.time) {
      Alert.alert('Ошибка', 'Выберите дату и время доставки');
      return;
    }

    if (!validateRecipients()) {
      return;
    }

    // Сначала создаем получателей
    const recipientsCreated = await createRecipientsForOrder();
    if (!recipientsCreated) return;

    // Затем создаем заказ
    try {
      const orderData = prepareOrderData();
      await dispatch(createOrder(orderData)).unwrap();
      
      // Показываем модалку успеха
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Ошибка', 'Не удалось оформить заказ');
    }
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
  const totalWeight = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Рендер содержимого для самовывоза с городами из Redux
  const renderPickupContent = () => {
    if (isLoadingTowns) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#203686" />
          <ThemedText style={styles.loadingText}>Загрузка городов...</ThemedText>
        </View>
      );
    }

    if (!towns || towns.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Нет доступных городов для самовывоза
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.pickupContent}>
        {towns.map((town) => (
          <TouchableOpacity
            key={town.id}
            style={styles.addressItem}
            onPress={() => handlePickTown(town.id)}
          >
            <View style={[
              styles.radioOuter,
              selectedPickupAddress === town.id && styles.radioOuterSelected
            ]}>
              {selectedPickupAddress === town.id && (
                <View style={styles.radioInner} />
              )}
            </View>
            <View style={styles.addressInfo}>
              <ThemedText style={styles.addressText}>{town.value}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Рендер табов доставки на основе данных с бекенда
  const renderDeliveryTabs = () => {
    const availableMethods = [
      { method: DeliveryMethod.Delivery, label: 'Доставка' },
      { method: DeliveryMethod.Pickup, label: 'Самовывоз' }
    ].filter(item => isMethodAvailable(item.method));

    if (availableMethods.length === 0) {
      return null;
    }

    return (
      <ThemedView 
        style={styles.tabsContainer} 
        lightColor="#F2F4F7"
        onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width / availableMethods.length)}
        ref={tabContainerRef}
      >
        <Animated.View style={[
          styles.activeTabIndicator,
          {
            width: tabContainerWidth,
            transform: [{ translateX: indicatorPosition }]
          }
        ]} />
        
        {availableMethods.map((item) => (
          <TouchableOpacity
            key={item.method}
            style={styles.tabButton}
            onPress={() => handleMethodChange(item.method)}
            activeOpacity={0.7}
          >
            <ThemedText 
              style={styles.tabText}
              lightColor={selectedMethod === item.method ? '#1B1B1C' : '#80818B'}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    );
  };

  return (
    <>
      <RNModal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ThemedView style={styles.container} lightColor="#EBEDF0" darkColor="#040508">
          <ModalHeader 
            title="Оформление" 
            showBackButton={true} 
            onBackPress={onClose}
          />

          {isLoadingRecipients ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#203686" />
              <ThemedText style={styles.loadingText}>Загрузка получателей...</ThemedText>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Блок с табами доставки */}
              <ThemedView style={styles.block} lightColor="#FFFFFF">
                <ThemedText style={styles.blockTitle}>Способ получения</ThemedText>
                
                {renderDeliveryTabs()}

                {/* Контент для самовывоза с городами из Redux */}
                {selectedMethod === DeliveryMethod.Pickup && renderPickupContent()}

                {selectedMethod === DeliveryMethod.Delivery && (
                  <View>
                    <ThemedText style={styles.blockTitle}>Компания и адрес</ThemedText>
                    <ThemedView lightColor='#F2F4F7' style={styles.compAndAdressCont}>
                      <TouchableOpacity 
                        style={styles.compAndAdressContRow}
                        onPress={() => setShowAddressModal(true)}
                      >
                        <View style={styles.compAndAdressContRowDoble}>
                          <IconCompany/>
                          <View style={styles.compAndAdressColumn}>
                            <ThemedText lightColor='#1B1B1C' style={styles.compText}
                              numberOfLines={1} 
                              ellipsizeMode="tail">
                              {me?.companies?.length === 0 
                                ? `${me?.individualProfile?.firstName || ''} ${me?.individualProfile?.lastName || ''} ${me?.individualProfile?.patronymic || ''}`.trim()
                                : currentCompany?.name
                              }
                            </ThemedText>
                            <ThemedText lightColor='#80818B' style={styles.addressTextText}  
                              numberOfLines={1} 
                              ellipsizeMode="tail">
                              {currentCompany?.id === savedAddress?.addressOwnerId ? savedAddress?.address : 
                               currentCompany?.deliveryAddresses?.[0]?.address || '-'}
                            </ThemedText>
                          </View>
                        </View>
                        <ArrowIconRight/>
                      </TouchableOpacity>
                      
                      <PrimaryButton
                        title="Изменить адрес"
                        onPress={() => setShowAddressModal(true)}
                        variant="black"
                        size="md"
                        fullWidth
                      />
                    </ThemedView>
                  </View>
                )}
              </ThemedView>

              {/* Блок даты и времени */}
              <ThemedView style={styles.block} lightColor="#FFFFFF">
                <ThemedText style={styles.blockTitle}>Дата и время получения</ThemedText>
                
                <TouchableOpacity 
                  style={styles.dateTimeDisplay}
                  onPress={() => setShowCalendarModal(true)}
                >
                  <View style={styles.dateTimeRow}>
                    <ThemedText style={styles.dateTimeLabel}></ThemedText>
                    <ThemedText style={styles.dateTimeValue} numberOfLines={1}>
                      {formatDateTimeDisplay()}
                    </ThemedText>
                  </View>
                  <ArrowIconRight style={styles.chevronRight} />
                </TouchableOpacity>
              </ThemedView>

              {/* Блок контактов получателя */}
              <ThemedView style={styles.block} lightColor="#FFFFFF">
                <ThemedText style={styles.blockTitle}>Контакты получателя</ThemedText>
                <ThemedText lightColor='#80818B' style={styles.mainPicker}>Основной получатель *</ThemedText>
                {recipients.map((recipient, index) => (
                  <View key={recipient.id} style={styles.recipientBlock}>
                    {index > 0 && (
                      <View style={styles.recipientHeader}>
                        <ThemedText style={styles.recipientTitle}>
                          Дополнительный получатель
                        </ThemedText>
                        <TouchableOpacity onPress={() => removeRecipient(recipient.id)}>
                          <TrashIcon />
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <AnimatedTextInput
                      placeholder="ФИО *"
                      value={recipient.fullname}
                      onChangeText={(text) => updateRecipient(recipient.id, 'fullname', text)}
                    />
                    <View style={styles.inputSpacer} />
                    <AnimatedTextInput
                      placeholder="Телефон *"
                      keyboardType="phone-pad"
                      value={recipient.phoneNumber}
                      onChangeText={(text) => updateRecipient(recipient.id, 'phoneNumber', text)}
                    />
                    <View style={styles.inputSpacer} />
                    <AnimatedTextInput
                      placeholder="Email *"
                      keyboardType="email-address"
                      value={recipient.email}
                      onChangeText={(text) => updateRecipient(recipient.id, 'email', text)}
                    />
                  </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={addRecipient}>
                  <ThemedText style={styles.addButtonText} lightColor="#203686">
                    + Добавить получателя
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* Блок товаров */}
              <ThemedView style={styles.block} lightColor="#FFFFFF">
                <ThemedText style={styles.blockTitle}>Информация о заказе</ThemedText>
                            
                <View style={styles.totalWeight}>
                  <ThemedText style={styles.totalWeightName}>Товаров в корзине</ThemedText>
                  <ThemedText style={styles.totalWeightValue}>
                    {selectedCartItems.length}
                  </ThemedText>
                </View>
                <View style={styles.totalWeight}>
                  <ThemedText style={styles.totalWeightName}>Общий вес</ThemedText>
                  <ThemedText style={styles.totalWeightValue}>
                    {totalWeight.toFixed(2)} кг
                  </ThemedText>
                </View>
                <View style={styles.totalWeight}>
                  <ThemedText style={styles.totalWeightName}>Сумма заказа</ThemedText>
                  <ThemedText style={styles.totalWeightValue}>
                    {totals.totalPrice.toLocaleString('ru-RU')} ₽
                  </ThemedText>
                </View>
              </ThemedView>

              {/* Блок способа оплаты */}
              <ThemedView style={styles.block} lightColor="#FFFFFF">
                <ThemedText style={styles.blockTitle}>Способ оплаты</ThemedText>
                
                {getAvailablePaymentTypes(selectedMethod).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.paymentMethod}
                    onPress={() => setSelectedPaymentType(type)}
                  >
                    <View style={[
                      styles.radioOuter,
                      selectedPaymentType === type && styles.radioOuterSelected
                    ]}>
                      {selectedPaymentType === type && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <ThemedText style={styles.paymentMethodText}>
                      {getPaymentTypeDisplayName(type)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>

              {/* Блок дополнительной информации */}
              <ThemedView style={[styles.block, styles.lastBlock]} lightColor="#FFFFFF">
                <ThemedText style={styles.blockTitle}>Дополнительная информация</ThemedText>
                <TouchableOpacity 
                  style={styles.notificationRow}
                  onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  <CustomCheckbox
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    lightColor="#F2F4F7"
                  />
                  <ThemedText style={styles.notificationText}>
                    Получать уведомления об оформлении и статусе доставки заказа
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.underNotificationText}>
                  После подтверждения заказа с вами свяжется наш менеджер для уточнения деталей.
                </ThemedText>
                <PrimaryButton
                  title="Оформить заказ"
                  onPress={handleCreateOrder}
                  variant="primary"
                  size="md"
                  loading={isCreatingOrder}
                  disabled={isCreatingOrder}
                  activeOpacity={0.8}
                  fullWidth
                />
              </ThemedView>
            </ScrollView>
          )}

          {/* Модалка выбора даты и времени */}
          <DateTimeModal
            visible={showCalendarModal}
            onClose={() => setShowCalendarModal(false)}
            onConfirm={handleDateTimeConfirm}
            initialDateTime={selectedDateTime}
            deliverySchedule={orderData?.deliverySchedule}
          />
        </ThemedView>

        <AddressSelectionModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          currentCompany={currentCompany}
          companies={me?.companies || []}
          selectedCompanyId={currentCompany?.id}
          onSelectCompany={handleSelectCompany}
          onAddCompany={handleAddCompany}
          onSelectAddress={handleSelectAddress}
          selectedAddressId={selectedAddress?.id}
        />

        <CompanySelectionModal
          visible={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          companies={me?.companies || []}
          selectedCompanyId={currentCompany?.id}
          onSelectCompany={handleSelectCompany}
          onAddCompany={handleAddCompany}
        />
      </RNModal>

      {/* Модалка успешного заказа */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
      />
    </>
  );
}

// Модалка успешного заказа
function SuccessModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));

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

  const handleClose = () => {
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <RNModal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              {/* Защелка для свайпа */}
              <TouchableOpacity
                style={styles.swipeHandleContainer}
                activeOpacity={0.7}
                onPress={handleClose}
              >
                <View style={styles.swipeHandle} />
              </TouchableOpacity>

              <View style={styles.successContainer}>
                <ThemedText style={styles.successTitle}>Спасибо за заказ!</ThemedText>
                <ThemedText style={styles.successText}>
                  В ближайшее время с вами свяжется{"\n"}Ваш менеджер для уточнения деталей.
                </ThemedText>

                <View style={styles.successButtons}>
                  <PrimaryButton
                    title="Детали заказа"
                    onPress={() => {
                      // Перейти к деталям заказа
                      handleClose();
                    }}
                    variant="primary"
                    size="md"
                    style={styles.successButton}
                  />
                  <PrimaryButton
                    title="Перейти в каталог"
                    onPress={() => {
                      // Перейти в каталог
                      handleClose();
                    }}
                    variant="third"
                    size="md"
                    style={styles.successButton}
                  />
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}


// Вспомогательные функции для работы с датами и временем
const getTimeSlotsForDate = (date: Date, schedule: any) => {
  if (!schedule?.weekSchedule) return [];

  const dayOfWeek = date.getDay();
  const daysMap = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };
  
  const dayName = daysMap[dayOfWeek as keyof typeof daysMap];
  const daySchedule = schedule.weekSchedule[dayName];
  
  if (daySchedule && daySchedule.isWorkingDay) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    let slots = [...(daySchedule.timeSlots || [])];
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinutes;
      const deliveryWindowHours = schedule.deliveryWindowHours || 2;
      
      slots = slots.filter((slot: any) => {
        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
        const slotStartInMinutes = slotHour * 60 + slotMinute;
        return slotStartInMinutes > currentTimeInMinutes + (deliveryWindowHours * 60);
      });
    }
    return slots;
  }
  return [];
};

const formatTimeForDisplay = (timeSlot: any) => {
  if (!timeSlot) return '';
  const start = timeSlot.startTime.slice(0, 5);
  const end = timeSlot.endTime.slice(0, 5);
  return `${start} – ${end}`;
};

// Модалка выбора даты и времени
// Модалка выбора даты и времени
function DateTimeModal({ visible, onClose, onConfirm, initialDateTime, deliverySchedule }: any) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDateTime.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(initialDateTime.time || '');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [months, setMonths] = useState<Date[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Автоматически выбираем ближайшую дату и время при загрузке
  useEffect(() => {
    if (visible && deliverySchedule?.nearestDeliveryDate && !initialDateTime.date) {
      const nearestDate = new Date(deliverySchedule.nearestDeliveryDate);
      const dateString = nearestDate.toDateString();
      setSelectedDate(dateString);
      
      const timeSlots = getTimeSlotsForDate(nearestDate, deliverySchedule);
      if (timeSlots.length > 0) {
        const nearestTime = formatTimeForDisplay(timeSlots[0]);
        setSelectedTime(nearestTime);
      }
      
      loadTimeSlotsForDate(dateString);
    } else if (visible && initialDateTime.date) {
      // Если есть сохраненная дата, используем её
      setSelectedDate(initialDateTime.date);
      setSelectedTime(initialDateTime.time);
      loadTimeSlotsForDate(initialDateTime.date);
    }
  }, [visible, deliverySchedule]);

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

  useEffect(() => {
    const today = new Date();
    const monthsArray = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      monthsArray.push(date);
    }
    setMonths(monthsArray);
  }, []);

  useEffect(() => {
    if (selectedDate && deliverySchedule) {
      loadTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate, deliverySchedule]);

  const handleClose = () => {
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const loadTimeSlotsForDate = (dateString: string) => {
    if (!deliverySchedule?.weekSchedule) return;
    const date = new Date(dateString);
    const slots = getTimeSlotsForDate(date, deliverySchedule);
    setAvailableTimeSlots(slots);
  };

  const generateDaysForMonth = (month: Date) => {
    const year = month.getFullYear();
    const month_index = month.getMonth();
    const firstDay = new Date(year, month_index, 1);
    const lastDay = new Date(year, month_index + 1, 0);
    
    const days = [];
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month_index, d));
    }
    
    return days;
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!deliverySchedule?.weekSchedule) return false;
    
    const dayOfWeek = date.getDay();
    const daysMap = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    };
    
    const dayName = daysMap[dayOfWeek as keyof typeof daysMap];
    const daySchedule = deliverySchedule.weekSchedule[dayName];
    
    return daySchedule?.isWorkingDay || false;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || !isDateAvailable(date);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const days = [
      'вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  const formatMonthYear = (date: Date) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      const dateString = date.toDateString();
      setSelectedDate(dateString);
      setSelectedTime('');
      setShowTimeModal(true);
    }
  };

  const handleTimeSelect = (timeSlot: any) => {
    const timeString = formatTimeForDisplay(timeSlot);
    setSelectedTime(timeString);
    setShowTimeModal(false);
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm({ date: selectedDate, time: selectedTime });
      handleClose();
    }
  };

  const renderMonth = ({ item: month }: { item: Date }) => {
    const days = generateDaysForMonth(month);

    return (
      <View style={styles.monthContainer}>
        <ThemedText style={styles.monthTitle}>{formatMonthYear(month)}</ThemedText>
        
        <View style={styles.weekDays}>
          {daysOfWeek.map(day => (
            <ThemedText key={day} style={styles.weekDay}>{day}</ThemedText>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            const isSelected = date && selectedDate === date.toDateString();
            const isNearest = date && deliverySchedule?.nearestDeliveryDate && 
              date.toDateString() === new Date(deliverySchedule.nearestDeliveryDate).toDateString();
            const disabled = !date || isDateDisabled(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  disabled && styles.dayDisabled,
                  (isSelected || isNearest) && !disabled && styles.daySelected
                ]}
                onPress={() => date && handleDateSelect(date)}
                disabled={disabled}
              >
                <ThemedText style={[
                  styles.dayText,
                  disabled && styles.dayTextDisabled,
                  (isSelected || isNearest) && !disabled && styles.dayTextSelected
                ]}>
                  {date?.getDate()}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              {/* Защелка для свайпа */}
              <TouchableOpacity
                style={styles.swipeHandleContainer}
                activeOpacity={0.7}
                onPress={handleClose}
              >
                <View style={styles.swipeHandle} />
              </TouchableOpacity>

              <ThemedText style={styles.chooseDateTime}>
                Выберите дату доставки
              </ThemedText>
              {/* <ModalHeader 
                title="Выберите дату доставки" 
                showBackButton={false} 
                onBackPress={handleClose}
              /> */}
              
              <FlatList
                data={months}
                renderItem={renderMonth}
                keyExtractor={(item) => item.toISOString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.monthsList}
              />

              {/* Нижняя панель с раздельными блоками даты и времени */}
              <ThemedView lightColor="#FFFFFF" style={styles.dateTimeBottomPanel}>
                <View style={styles.selectedDateTime}>
                  {/* Блок выбранной даты */}
                  <TouchableOpacity 
                    style={styles.dateTimeBlock}
                    onPress={() => {
                      // Если нужно, можно сделать что-то при нажатии на дату
                    }}
                  >
                    <ThemedView lightColor="#F2F4F7" style={styles.dateTimeBlockInner}>
                      {/* <ThemedText style={styles.dateTimeBlockLabel}>Дата</ThemedText> */}
                      <ThemedText style={styles.dateTimeBlockValue}>
                        {selectedDate ? formatDateForDisplay(selectedDate) : 'Не выбрана'}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>

                  {/* Блок выбора времени */}
                  <TouchableOpacity 
                    style={styles.dateTimeBlock}
                    onPress={() => {
                      if (selectedDate && availableTimeSlots.length > 0) {
                        setShowTimeModal(true);
                      }
                    }}
                    disabled={!selectedDate || availableTimeSlots.length === 0}
                  >
                    <ThemedView 
                      lightColor={!selectedDate || availableTimeSlots.length === 0 ? "#F5F5F5" : "#F2F4F7"} 
                      style={[
                        styles.dateTimeBlockInner,
                        (!selectedDate || availableTimeSlots.length === 0) && styles.dateTimeBlockDisabled
                      ]}
                    >
                      {/* <ThemedText style={styles.dateTimeBlockLabel}>Время</ThemedText> */}
                      <ThemedText style={styles.dateTimeBlockValue}>
                        {selectedTime || 'Не выбрано'}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                </View>

                <PrimaryButton
                  title="Применить"
                  onPress={handleConfirm}
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={!selectedDate || !selectedTime}
                />
              </ThemedView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* Модалка выбора времени */}
      <TimeModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelectTime={handleTimeSelect}
        selectedTime={selectedTime}
        timeSlots={availableTimeSlots}
        selectedDate={selectedDate}
        deliverySchedule={deliverySchedule}
      />
    </RNModal>
  );
}

// Модалка выбора времени
function TimeModal({ visible, onClose, onSelectTime, selectedTime, timeSlots, selectedDate, deliverySchedule }: any) {
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));

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

  const handleClose = () => {
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const formatDateForHeader = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const days = [
      'воскресенье', 'понедельник', 'вторник', 'среда', 
      'четверг', 'пятница', 'суббота'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  // Определяем, является ли слот ближайшим временем
  const isNearestTime = (slot: any) => {
    if (!selectedDate || !deliverySchedule?.nearestDeliveryDate) return false;
    
    const nearestDate = new Date(deliverySchedule.nearestDeliveryDate);
    const currentDate = new Date(selectedDate);
    
    if (currentDate.toDateString() !== nearestDate.toDateString()) return false;
    
    const timeSlots = getTimeSlotsForDate(currentDate, deliverySchedule);
    if (timeSlots.length > 0) {
      const firstSlot = timeSlots[0];
      return firstSlot.startTime === slot.startTime;
    }
    
    return false;
  };

  return (
    <RNModal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.timeModalContent,
                {
                  transform: [{ translateY: modalTranslateY }],
                },
              ]}
            >
              {/* Защелка для свайпа */}
              <TouchableOpacity
                style={styles.swipeHandleContainer}
                activeOpacity={0.7}
                onPress={handleClose}
              >
                <View style={styles.swipeHandle} />
              </TouchableOpacity>


              <ThemedText style={styles.chooseDateTime}>
                Выберите время
              </ThemedText>
              
              {/* {selectedDate && (
                <ThemedView lightColor="#F2F4F7" style={styles.selectedDateHeader}>
                  <ThemedText style={styles.selectedDateHeaderText}>
                    {formatDateForHeader(selectedDate)}
                  </ThemedText>
                </ThemedView>
              )} */}
              
              <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                {timeSlots.map((slot: any, index: number) => {
                  const timeString = formatTimeForDisplay(slot);
                  const isSelected = selectedTime === timeString;
                  const isNearest = isNearestTime(slot);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.timeSlot}
                      onPress={() => onSelectTime(slot)}
                    >
                      <View style={[
                        styles.radioOuter,
                        (isSelected || isNearest) && styles.radioOuterSelected
                      ]}>
                        {(isSelected || isNearest) && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <ThemedText style={[
                        styles.timeSlotText,
                        (isSelected || isNearest) && styles.timeSlotTextSelected
                      ]}>
                        {timeString}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  block: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  lastBlock: {
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  mainPicker: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    borderRadius: 12,
    padding: 3,
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(40px)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabIndicator: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    height: '100%',
    top: 3,
    left: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickupContent: {
    marginTop: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressHours: {
    fontSize: 12,
    color: '#80818B',
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
  dateTimeDisplay: {
    position: 'relative',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeRow: {
    flexDirection: 'row',
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#80818B',
    marginRight: 8,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  chevronRight: {
    width: 20,
    height: 20,
  },
  recipientBlock: {
    marginBottom: 16,
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipientTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#203686',
  },
  inputSpacer: {
    height: 8,
  },
  addButton: {
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cartItemQuantity: {
    fontSize: 12,
    color: '#80818B',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  totalWeight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 5,
  },
  totalWeightValue: {
    fontWeight: '500',
    fontSize: 14,
  },
  totalWeightName: {
    fontWeight: '500',
    fontSize: 14,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  paymentMethodText: {
    fontSize: 14,
    marginLeft: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 16,
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500'
  },
  underNotificationText: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
    marginBottom: 27,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  infoText: {
    marginTop: 8,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18.2,
    width: '80%',
  },
  infoImage: {
    opacity: 0.1,
    position: 'absolute',
    width: 267,
    height: 110,
    transform: [{ scaleX: -1 }],
    right: -80,
    bottom: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomPanelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomLeft: {
    flex: 1,
  },
  bottomItemsCount: {
    fontSize: 14,
    color: '#80818B',
    marginBottom: 4,
  },
  bottomTotalPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomCheckoutButton: {
    backgroundColor: '#203686',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  bottomCheckoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
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
  chooseDateTime:{
    fontWeight: '600',
    fontSize: 20,
    padding: 16,
  },
  monthsList: {
    padding: 16,
    paddingBottom: 120,
  },
  monthContainer: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#80818B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: '#203686',
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: '#80818B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dateTimeBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedDateTimeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  selectedDateTimeInner: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedDateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B1B1C',
  },
  selectedDateTime: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateTimeBlock: {
    flex: 1,
  },
  dateTimeBlockInner: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  dateTimeBlockDisabled: {
    opacity: 0.5,
  },
  dateTimeBlockLabel: {
    fontSize: 12,
    color: '#80818B',
  },
  dateTimeBlockValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  selectedDateHeader: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedDateHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#203686',
  },
  timeList: {
    padding: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7',
  },
  timeSlotText: {
    fontSize: 14,
    marginLeft: 12,
  },
  timeSlotTextSelected: {
    color: '#203686',
    fontWeight: '500',
  },
  compAndAdressCont: {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16
  },
  compAndAdressContRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  compAndAdressContRowDoble: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  compAndAdressColumn: {
    flexDirection: 'column',
    flex: 1,
    flexShrink: 1,
  },
  compText: {
    fontWeight: '600',
    fontSize: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 1,
  },
  addressTextText: {
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#80818B',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#80818B',
    textAlign: 'center',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#203686',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#80818B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  successButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  successButton: {
    flex: 1,
  },
});