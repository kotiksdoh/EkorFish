// app/modals/checkout.tsx
import { ArrowIconRight, IconCompany, TrashIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { selectCompany, getTowns } from '@/features/auth/authSlice';
import { ModalHeader } from '@/features/auth/ui/Header';
import { getOrderPageData } from '@/features/catalog/catalogSlice';
import { PrimaryButton } from '@/features/home';
import { baseUrl } from '@/features/shared/services/axios';
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
  View,
  ActivityIndicator
} from 'react-native';

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
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface DateTimeSelection {
  date: string;
  time: string;
}

interface DeliveryMethodConfig {
  method: DeliveryMethod;
  availablePaymentTypes: PaymentType[];
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
    { id: '1', firstName: '', lastName: '', phone: '', email: '' }
  ]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  const dispatch = useAppDispatch();
  const tabContainerRef = useRef<View>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  
  // Данные с бекенда
  const orderData = useAppSelector((state) => state.catalog.order);
  const deliveryMethods = orderData?.deliveryMethods || [];
  const towns = useAppSelector((state) => state.auth.towns);
  const isLoadingTowns = useAppSelector((state) => state.auth.isLoadingTowns);
  
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

  // Получаем название метода доставки для отображения
  const getMethodDisplayName = (method: DeliveryMethod): string => {
    switch (method) {
      case DeliveryMethod.Delivery:
        return 'Доставка';
      case DeliveryMethod.Pickup:
        return 'Самовывоз';
      default:
        return '';
    }
  };

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

  // Обновляем способ оплаты при смене метода доставки
  useEffect(() => {
    const availableTypes = getAvailablePaymentTypes(selectedMethod);
    if (availableTypes.length > 0 && !availableTypes.includes(selectedPaymentType)) {
      setSelectedPaymentType(availableTypes[0]);
    }
  }, [selectedMethod]);

  const loadOrderData = async () => {
    try {
      await dispatch(getOrderPageData()).unwrap();
    } catch (error) {
      console.error('Error loading order data:', error);
    }
  };

  const handleSelectCompany = (company: any) => {
    dispatch(selectCompany(company));
    setSelectedAddress(null);
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
  };

  const handleAddAddress = () => {
    console.log('Open add address modal');
  };

  const handleAddCompany = () => {
    setShowAddressModal(false);
    setTimeout(() => {
      // открыть модалку регистрации компании
    }, 300);
  };

  const handleMethodChange = (method: DeliveryMethod) => {
    setSelectedMethod(method);
    
    // Анимируем индикатор
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
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    };
    setRecipients([...recipients, newRecipient]);
  };

  const removeRecipient = (id: string) => {
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
        <ThemedText style={styles.companyName}>ООО "Торговый дом"</ThemedText>
        {towns.map((town) => (
          <TouchableOpacity
            key={town.id}
            style={styles.addressItem}
            onPress={() => setSelectedPickupAddress(town.id)}
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
                          {selectedAddress?.address || currentCompany?.deliveryAddresses?.[0]?.address || '-'}
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
                <ThemedText style={styles.dateTimeLabel}>Дата:</ThemedText>
                <ThemedText style={styles.dateTimeValue}>
                  {selectedDateTime.date ? formatDateDisplay(selectedDateTime.date) : 'Не выбрана'}
                </ThemedText>
              </View>
              <View style={styles.dateTimeRow}>
                <ThemedText style={styles.dateTimeLabel}>Время:</ThemedText>
                <ThemedText style={styles.dateTimeValue}>
                  {selectedDateTime.time || 'Не выбрано'}
                </ThemedText>
              </View>
              <View style={styles.chevronRight}>
                {/* <ChevronRight /> */}
              </View>
            </TouchableOpacity>
          </ThemedView>

          {/* Блок контактов получателя */}
          <ThemedView style={styles.block} lightColor="#FFFFFF">
            <ThemedText style={styles.blockTitle}>Контакты получателя</ThemedText>
            <ThemedText lightColor='#80818B' style={styles.mainPicker}>Основной получатель</ThemedText>
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
                  placeholder="Имя"
                  value={recipient.firstName}
                  onChangeText={(text) => updateRecipient(recipient.id, 'firstName', text)}
                />
                <View style={styles.inputSpacer} />
                <AnimatedTextInput
                  placeholder="Фамилия"
                  value={recipient.lastName}
                  onChangeText={(text) => updateRecipient(recipient.id, 'lastName', text)}
                />
                <View style={styles.inputSpacer} />
                <AnimatedTextInput
                  placeholder="Телефон"
                  keyboardType="phone-pad"
                  value={recipient.phone}
                  onChangeText={(text) => updateRecipient(recipient.id, 'phone', text)}
                />
                <View style={styles.inputSpacer} />
                <AnimatedTextInput
                  placeholder="Email"
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
{/*             
            {selectedCartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
               
                <View style={styles.cartItemInfo}>
                  
                </View>
                <ThemedText style={styles.cartItemPrice}>
                  {item.totalPrice.toLocaleString('ru-RU')} ₽
                </ThemedText>
              </View>
            ))} */}
                        
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
          </ThemedView>

          {/* Блок способа оплаты - теперь на основе данных с бекенда */}
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
                onPress={() => {
                  // setCheckoutModalVisible(true);
             
                }}
                variant="primary"
                size="md"
                activeOpacity={0.8}
                fullWidth
              />
          </ThemedView>
        </ScrollView>

        {/* Нижняя панель с кнопкой */}
        {/* <ThemedView lightColor="#FFFFFF" style={styles.bottomPanel}>
          <View style={styles.bottomPanelContent}>
            <View style={styles.bottomLeft}>
              <ThemedText style={styles.bottomTotalPrice}>
                {totals.totalPrice.toLocaleString('ru-RU')} ₽
              </ThemedText>
              <ThemedText style={styles.bottomItemsCount}>
                {totals.totalItems} {getDeclension(totals.totalItems, ['товар', 'товара', 'товаров'])}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.bottomCheckoutButton}
              onPress={() => {
                console.log('Оформление заказа', {
                  deliveryMethod: selectedMethod,
                  paymentType: selectedPaymentType,
                  pickupAddress: selectedPickupAddress,
                  dateTime: selectedDateTime,
                  recipients
                });
              }}
            >
              <ThemedText style={styles.bottomCheckoutButtonText}>
                Оформить заказ
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView> */}

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
        // onAddAddress={handleAddAddress}
        onSelectAddress={handleSelectAddress}
        selectedAddressId={selectedAddress?.id}
        // onAddressAdded={handleAddressAdded}
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
  );
}

// Обновленный компонент модалки выбора даты и времени
function DateTimeModal({ visible, onClose, onConfirm, initialDateTime, deliverySchedule }: any) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDateTime.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(initialDateTime.time || '');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [months, setMonths] = useState<Date[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  useEffect(() => {
    // Генерируем 3 месяца для прокрутки
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

  const loadTimeSlotsForDate = (dateString: string) => {
    if (!deliverySchedule?.weekSchedule) return;

    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 - воскресенье, 1 - понедельник, ...
    
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
    
    if (daySchedule && daySchedule.isWorkingDay) {
      // Фильтруем слоты, которые уже прошли, если это сегодня
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      let slots = [...(daySchedule.timeSlots || [])];
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinutes;
        
        const deliveryWindowHours = deliverySchedule.deliveryWindowHours || 2;
        
        slots = slots.filter((slot: any) => {
          const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
          const slotStartInMinutes = slotHour * 60 + slotMinute;
          // Добавляем время на подготовку заказа из конфига
          return slotStartInMinutes > currentTimeInMinutes + (deliveryWindowHours * 60);
        });
      }
      
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
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

  const formatTimeForDisplay = (timeSlot: any) => {
    if (!timeSlot) return '';
    const start = timeSlot.startTime.slice(0, 5);
    const end = timeSlot.endTime.slice(0, 5);
    return `${start} – ${end}`;
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
      setSelectedDate(date.toDateString());
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
      onClose();
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
            const disabled = !date || isDateDisabled(date);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  disabled && styles.dayDisabled,
                  isSelected && styles.daySelected
                ]}
                onPress={() => date && handleDateSelect(date)}
                disabled={disabled}
              >
                <ThemedText style={[
                  styles.dayText,
                  disabled && styles.dayTextDisabled,
                  isSelected && styles.dayTextSelected
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
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent} lightColor="#FFFFFF">
          <ModalHeader 
            title="Выберите дату доставки" 
            showBackButton={true} 
            onBackPress={onClose}
          />
          
          <FlatList
            data={months}
            renderItem={renderMonth}
            keyExtractor={(item) => item.toISOString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.monthsList}
          />

          {/* Нижняя панель с выбранными датой/временем и кнопкой */}
          <ThemedView lightColor="#FFFFFF" style={styles.dateTimeBottomPanel}>
            <View style={styles.selectedDateTime}>
              <TouchableOpacity style={styles.dateTimeBlock}>
                <ThemedView lightColor="#F2F4F7" style={styles.dateTimeBlockInner}>
                  <ThemedText style={styles.dateTimeBlockLabel}>Дата</ThemedText>
                  <ThemedText style={styles.dateTimeBlockValue}>
                    {selectedDate ? formatDateForDisplay(selectedDate) : 'Не выбрана'}
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>

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
                  <ThemedText style={styles.dateTimeBlockLabel}>Время</ThemedText>
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
        </ThemedView>

        {/* Модалка выбора времени */}
        <TimeModal
          visible={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          onSelectTime={handleTimeSelect}
          selectedTime={selectedTime}
          timeSlots={availableTimeSlots}
          selectedDate={selectedDate}
        />
      </View>
    </RNModal>
  );
}

// Компонент модалки выбора времени
function TimeModal({ visible, onClose, onSelectTime, selectedTime, timeSlots, selectedDate }: any) {
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

  const formatTimeSlot = (slot: any) => {
    const start = slot.startTime.slice(0, 5);
    const end = slot.endTime.slice(0, 5);
    return `${start} – ${end}`;
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.timeModalContent} lightColor="#FFFFFF">
          <ModalHeader 
            title="Выберите время" 
            showBackButton={true} 
            onBackPress={onClose}
          />
          
          {selectedDate && (
            <ThemedView lightColor="#F2F4F7" style={styles.selectedDateHeader}>
              <ThemedText style={styles.selectedDateHeaderText}>
                {formatDateForHeader(selectedDate)}
              </ThemedText>
            </ThemedView>
          )}
          
          <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
            {timeSlots.map((slot: any, index: number) => {
              const timeString = formatTimeSlot(slot);
              const isSelected = selectedTime === timeString;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.timeSlot}
                  onPress={() => onSelectTime(slot)}
                >
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected
                  ]}>
                    {isSelected && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <ThemedText style={[
                    styles.timeSlotText,
                    isSelected && styles.timeSlotTextSelected
                  ]}>
                    {timeString}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ThemedView>
      </View>
    </RNModal>
  );
}

const getDeclension = (count: number, words: [string, string, string]) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]
  ];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    // paddingBottom: 100,
  },
  block: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  lastBlock: {
    // marginBottom: 16,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  mainPicker:{
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
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#80818B',
    width: 50,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  chevronRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
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
    // gap:
    // marginTop: 12,
    paddingBottom: 5,
    // borderTopWidth: 1,
    // borderTopColor: '#F0F3F7',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
    maxHeight: '80%',
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
  }
});