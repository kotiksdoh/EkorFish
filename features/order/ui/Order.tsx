// app/modals/checkout.tsx
import { ArrowIconRight, IconCompany, TrashIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { selectCompany } from '@/features/auth/authSlice';
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
  View
} from 'react-native';

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

type DeliveryMethod = 'Delivery' | 'Pickup';
type PaymentType = 'Cashless' | 'Cash';

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

export default function CheckoutModal({
  visible,
  onClose,
  selectedItems,
  cartItems,
  totals
}: CheckoutModalProps) {
  const [selectedTab, setSelectedTab] = useState<DeliveryMethod>('Delivery');
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('');
  const [selectedDateTime, setSelectedDateTime] = useState<DateTimeSelection>({ date: '', time: '' });
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>('Cashless');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', firstName: '', lastName: '', phone: '', email: '' }
  ]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  const dispatch = useAppDispatch();
  const tabContainerRef = useRef<View>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const orderData = useAppSelector((state) => state.catalog.order);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  // Моковые адреса для самовывоза
  const pickupAddresses = [
    { id: '1', address: 'ул. Ленина, 1, Москва', workingHours: 'пн-пт 9:00-18:00' },
    { id: '2', address: 'пр-т Мира, 15, Москва', workingHours: 'пн-сб 10:00-20:00' },
    { id: '3', address: 'ул. Тверская, 25, Москва', workingHours: 'пн-вс 9:00-21:00' },
  ];
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);

  const handleSelectCompany = (company: any) => {
    dispatch(selectCompany(company));
    // Сбрасываем выбранный адрес при смене компании
    setSelectedAddress(null);
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
  };
  const handleAddAddress = () => {
    // Здесь логика открытия модалки добавления адреса
    console.log('Open add address modal');
  };

  const handleAddCompany = () => {
    // Здесь логика открытия модалки регистрации компании
    setShowAddressModal(false);
    setTimeout(() => {
      // открыть модалку регистрации компании
    }, 300);
  };
  // Методы оплаты для разных типов доставки
  const paymentMethods = {
    Delivery: ['Cashless'] as PaymentType[],
    Pickup: ['Cashless', 'Cash'] as PaymentType[],
  };

  useEffect(() => {
    if (visible) {
      loadOrderData();
    }
  }, [visible]);

  const loadOrderData = async () => {
    try {
      await dispatch(getOrderPageData()).unwrap();
    } catch (error) {
      console.error('Error loading order data:', error);
    }
  };

  const handleTabChange = (tab: DeliveryMethod) => {
    setSelectedTab(tab);
    Animated.spring(indicatorPosition, {
      toValue: tab === 'Delivery' ? 0 : tabContainerWidth,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
      stiffness: 120
    }).start();
    
    setSelectedPaymentType(paymentMethods[tab][0]);
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

  const me = useAppSelector((state) => state.auth.me);

  console.log('me', me)
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
            
            <ThemedView 
              style={styles.tabsContainer} 
              lightColor="#F2F4F7"
              onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width / 2)}
              ref={tabContainerRef}
            >
              <Animated.View style={[
                styles.activeTabIndicator,
                {
                  width: tabContainerWidth,
                  transform: [{ translateX: indicatorPosition }]
                }
              ]} />
              
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handleTabChange('Delivery')}
                activeOpacity={0.7}
              >
                <ThemedText 
                  style={styles.tabText}
                  lightColor={selectedTab === 'Delivery' ? '#1B1B1C' : '#80818B'}
                >
                  Доставка
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => handleTabChange('Pickup')}
                activeOpacity={0.7}
              >
                <ThemedText 
                  style={styles.tabText}
                  lightColor={selectedTab === 'Pickup' ? '#1B1B1C' : '#80818B'}
                >
                  Самовывоз
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Контент для самовывоза */}
            {selectedTab === 'Pickup' && (
              <View style={styles.pickupContent}>
                <ThemedText style={styles.companyName}>ООО "Торговый дом"</ThemedText>
                {pickupAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.addressItem}
                    onPress={() => setSelectedPickupAddress(address.id)}
                  >
                    <View style={[
                      styles.radioOuter,
                      selectedPickupAddress === address.id && styles.radioOuterSelected
                    ]}>
                      {selectedPickupAddress === address.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.addressInfo}>
                      <ThemedText style={styles.addressText}>{address.address}</ThemedText>
                      <ThemedText style={styles.addressHours}>{address.workingHours}</ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {selectedTab !== 'Pickup' && (
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
            <ThemedText style={styles.blockTitle}>Товары в корзине</ThemedText>
            
            {selectedCartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemImage}>
                  {item.productImage ? (
                    <Image
                      source={{ uri: `${baseUrl}/${item.productImage}` }}
                      style={styles.image}
                      contentFit="cover"
                    />
                  ) : (
                    <Image
                      source={require('@/assets/icons/png/noImage.png')}
                      style={styles.image}
                      contentFit="cover"
                    />
                  )}
                </View>
                <View style={styles.cartItemInfo}>
                  <ThemedText style={styles.cartItemName} numberOfLines={2}>
                    {item.productName}
                  </ThemedText>
                  <ThemedText style={styles.cartItemQuantity}>
                    {item.quantity} {item.measureType === 'килограмм' ? 'кг' : 'шт'} • {item.price}₽/{item.measureType === 'килограмм' ? 'кг' : 'шт'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cartItemPrice}>
                  {item.totalPrice.toLocaleString('ru-RU')} ₽
                </ThemedText>
              </View>
            ))}
            
            <View style={styles.totalWeight}>
              <ThemedText>Общий вес</ThemedText>
              <ThemedText style={styles.totalWeightValue}>
                {totalWeight.toFixed(2)} кг
              </ThemedText>
            </View>
          </ThemedView>

          {/* Блок способа оплаты */}
          <ThemedView style={styles.block} lightColor="#FFFFFF">
            <ThemedText style={styles.blockTitle}>Способ оплаты</ThemedText>
            
            {paymentMethods[selectedTab].map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.paymentMethod}
                onPress={() => setSelectedPaymentType(method)}
              >
                <View style={[
                  styles.radioOuter,
                  selectedPaymentType === method && styles.radioOuterSelected
                ]}>
                  {selectedPaymentType === method && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText style={styles.paymentMethodText}>
                  {method === 'Cashless' ? 'Безналичный расчёт' : 'Наличными'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>

          {/* Блок дополнительной информации */}
          <ThemedView style={[styles.block, styles.lastBlock]} lightColor="#FFFFFF">
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
          </ThemedView>

          {/* Информационный блок о доставке */}
          <ThemedView lightColor="#E1F0FF" darkColor="#212945" style={styles.infoBlock}>
            <View style={styles.infoTextContainer}>
              <ThemedText lightColor="#203686" style={styles.infoTitle}>
                Бесплатная доставка {'\n'}при заказе от — 10 000 ₽.
              </ThemedText>
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF" style={styles.infoText}>
                Стоимость доставки по МСК и СПБ {'\n'}при заказе от 3000 ₽ до 10000 ₽ {'\n'}составит 1000 ₽. По областям 1500 ₽.
              </ThemedText>
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF" style={styles.infoText}>
                Минимальная сумма заказа — 3 000 ₽.
              </ThemedText>
            </View>
            <Image
              source={require('@/assets/icons/png/carPng.png')}
              style={styles.infoImage}
              resizeMode="contain"
            />
          </ThemedView>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Нижняя панель с кнопкой */}
        <ThemedView lightColor="#FFFFFF" style={styles.bottomPanel}>
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
              onPress={() => console.log('Оформление заказа')}
            >
              <ThemedText style={styles.bottomCheckoutButtonText}>
                Оформить заказ
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Модалка выбора даты и времени */}
        <DateTimeModal
          visible={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          onConfirm={handleDateTimeConfirm}
          initialDateTime={selectedDateTime}
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
            onAddAddress={handleAddAddress}
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
  );
}

// Компонент модалки выбора даты и времени
// Компонент модалки выбора даты и времени
function DateTimeModal({ visible, onClose, onConfirm, initialDateTime }: any) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDateTime.date || '');
  const [selectedTime, setSelectedTime] = useState<string>(initialDateTime.time || '');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [months, setMonths] = useState<Date[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const orderData = useAppSelector((state) => state.catalog.order);
  console.log('orderData', orderData)
  // Данные с бека (нужно получать через пропсы или из стора)
  const deliverySchedule = orderData?.deliverySchedule
  // {
  //   weekSchedule: {
  //     Monday: {
  //       dayOfWeek: 1,
  //       startTime: "07:00:00",
  //       endTime: "21:00:00",
  //       isWorkingDay: true,
  //       timeSlots: [
  //         { startTime: "07:00:00", endTime: "09:00:00" },
  //         { startTime: "09:00:00", endTime: "11:00:00" },
  //         { startTime: "11:00:00", endTime: "13:00:00" },
  //         { startTime: "13:00:00", endTime: "15:00:00" },
  //         { startTime: "15:00:00", endTime: "17:00:00" },
  //         { startTime: "17:00:00", endTime: "19:00:00" },
  //         { startTime: "19:00:00", endTime: "21:00:00" }
  //       ]
  //     },
  //     Tuesday: {
  //       dayOfWeek: 2,
  //       startTime: "07:00:00",
  //       endTime: "21:00:00",
  //       isWorkingDay: true,
  //       timeSlots: [
  //         { startTime: "07:00:00", endTime: "09:00:00" },
  //         { startTime: "09:00:00", endTime: "11:00:00" },
  //         { startTime: "11:00:00", endTime: "13:00:00" },
  //         { startTime: "13:00:00", endTime: "15:00:00" },
  //         { startTime: "15:00:00", endTime: "17:00:00" },
  //         { startTime: "17:00:00", endTime: "19:00:00" },
  //         { startTime: "19:00:00", endTime: "21:00:00" }
  //       ]
  //     },
  //     Wednesday: {
  //       dayOfWeek: 3,
  //       startTime: "07:00:00",
  //       endTime: "21:00:00",
  //       isWorkingDay: true,
  //       timeSlots: [
  //         { startTime: "07:00:00", endTime: "09:00:00" },
  //         { startTime: "09:00:00", endTime: "11:00:00" },
  //         { startTime: "11:00:00", endTime: "13:00:00" },
  //         { startTime: "13:00:00", endTime: "15:00:00" },
  //         { startTime: "15:00:00", endTime: "17:00:00" },
  //         { startTime: "17:00:00", endTime: "19:00:00" },
  //         { startTime: "19:00:00", endTime: "21:00:00" }
  //       ]
  //     },
  //     Thursday: {
  //       dayOfWeek: 4,
  //       startTime: "07:00:00",
  //       endTime: "21:00:00",
  //       isWorkingDay: true,
  //       timeSlots: [
  //         { startTime: "07:00:00", endTime: "09:00:00" },
  //         { startTime: "09:00:00", endTime: "11:00:00" },
  //         { startTime: "11:00:00", endTime: "13:00:00" },
  //         { startTime: "13:00:00", endTime: "15:00:00" },
  //         { startTime: "15:00:00", endTime: "17:00:00" },
  //         { startTime: "17:00:00", endTime: "19:00:00" },
  //         { startTime: "19:00:00", endTime: "21:00:00" }
  //       ]
  //     },
  //     Friday: {
  //       dayOfWeek: 5,
  //       startTime: "07:00:00",
  //       endTime: "21:00:00",
  //       isWorkingDay: true,
  //       timeSlots: [
  //         { startTime: "07:00:00", endTime: "09:00:00" },
  //         { startTime: "09:00:00", endTime: "11:00:00" },
  //         { startTime: "11:00:00", endTime: "13:00:00" },
  //         { startTime: "13:00:00", endTime: "15:00:00" },
  //         { startTime: "15:00:00", endTime: "17:00:00" },
  //         { startTime: "17:00:00", endTime: "19:00:00" },
  //         { startTime: "19:00:00", endTime: "21:00:00" }
  //       ]
  //     },
  //     Saturday: {
  //       dayOfWeek: 6,
  //       startTime: "07:00:00",
  //       endTime: "15:00:00",
  //       isWorkingDay: true,
  //       timeSlots: [
  //         { startTime: "07:00:00", endTime: "09:00:00" },
  //         { startTime: "09:00:00", endTime: "11:00:00" },
  //         { startTime: "11:00:00", endTime: "13:00:00" },
  //         { startTime: "13:00:00", endTime: "15:00:00" }
  //       ]
  //     },
  //     Sunday: {
  //       dayOfWeek: 0,
  //       startTime: "00:00:00",
  //       endTime: "00:00:00",
  //       isWorkingDay: false,
  //       timeSlots: []
  //     }
  //   }
  // };

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  useEffect(() => {
    // Генерируем 3 месяца для прокрутки (достаточно)
    const today = new Date();
    const monthsArray = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      monthsArray.push(date);
    }
    setMonths(monthsArray);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadTimeSlotsForDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 - воскресенье, 1 - понедельник, ...
    
    // Маппинг дней недели на английские названия
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
    const daySchedule = deliverySchedule.weekSchedule[dayName as keyof typeof deliverySchedule.weekSchedule];
    
    if (daySchedule && daySchedule.isWorkingDay) {
      // Фильтруем слоты, которые уже прошли, если это сегодня
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      let slots = [...daySchedule.timeSlots];
      if (isToday) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinutes;
        
        slots = slots.filter(slot => {
          const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
          const slotStartInMinutes = slotHour * 60 + slotMinute;
          // Добавляем 2 часа на подготовку заказа
          return slotStartInMinutes > currentTimeInMinutes + 120;
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
    // Корректировка: если воскресенье (0), то смещение 6, иначе day - 1
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
    const daySchedule = deliverySchedule.weekSchedule[dayName as keyof typeof deliverySchedule.weekSchedule];
    
    return daySchedule?.isWorkingDay || false;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Дата в прошлом или недоступна по расписанию
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
      setSelectedTime(''); // Сбрасываем время при выборе новой даты
      // Автоматически открываем модалку выбора времени
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
        
        {/* Дни недели для каждого месяца */}
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
              {/* Блок с выбранной датой */}
              <TouchableOpacity 
                style={styles.dateTimeBlock}
                onPress={() => {
                  // Скролл к календарю или просто закрыть/открыть
                }}
              >
                <ThemedView lightColor="#F2F4F7" style={styles.dateTimeBlockInner}>
                  <ThemedText style={styles.dateTimeBlockLabel}>Дата</ThemedText>
                  <ThemedText style={styles.dateTimeBlockValue}>
                    {selectedDate ? formatDateForDisplay(selectedDate) : 'Не выбрана'}
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>

              {/* Блок с выбранным временем */}
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

// Компонент модалки выбора времени
// function TimeModal({ visible, onClose, onSelectTime, selectedTime, timeSlots }: any) {
//   return (
//     <RNModal
//       visible={visible}
//       animationType="slide"
//       transparent={true}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <ThemedView style={styles.modalContent} lightColor="#FFFFFF">
//           <ModalHeader 
//             title="Выберите время" 
//             showBackButton={true} 
//             onBackPress={onClose}
//           />
          
//           <ScrollView style={styles.timeList}>
//             {timeSlots.map((slot: string) => (
//               <TouchableOpacity
//                 key={slot}
//                 style={styles.timeSlot}
//                 onPress={() => {
//                   onSelectTime(slot);
//                   onClose();
//                 }}
//               >
//                 <View style={[
//                   styles.radioOuter,
//                   selectedTime === slot && styles.radioOuterSelected
//                 ]}>
//                   {selectedTime === slot && (
//                     <View style={styles.radioInner} />
//                   )}
//                 </View>
//                 <ThemedText style={styles.timeSlotText}>{slot}</ThemedText>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </ThemedView>
//       </View>
//     </RNModal>
//   );
// }

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
    padding: 16,
    paddingBottom: 100,
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
    marginBottom: 4,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F7',
  },
  totalWeightValue: {
    fontWeight: '600',
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
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
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

  compAndAdressCont:{
    // marginVertical: 16,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16
  },
  compAndAdressContRow:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  compAndAdressContRowDoble:{
    flexDirection: 'row',
    gap: 12,
    flex: 1, // Добавьте это
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
    flexShrink: 1, // Чтобы текст сжималс
  },
  addressTextText:{
    fontWeight: '500',
    fontSize: 14,
  }

});