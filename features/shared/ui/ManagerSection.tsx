// features/shared/ui/ManagerSection.tsx
import { ArrowIconRight, MessageIcon, PhoneIcon, RefreshIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMangers, getMyInfo, setCompany } from '@/features/auth/authSlice';
import { axdef, baseUrl } from '@/features/shared/services/axios';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import ManagerReviewModal from './ManagerReviewModal';

interface Manager {
  id: string;
  name: string;
  image?: string;
  phoneNumber?: string;
  hasReviewed?: boolean;
}

interface ManagerCardProps {
  manager: Manager;
  isCurrentManager?: boolean;
  onSelect?: (managerId: string) => void;
  onChangePress?: () => void;
  onReviewPress?: () => void;
}

// Карточка для отображения текущего менеджера (с кнопками)
const CurrentManagerCard = ({ manager, onChangePress, onReviewPress }: ManagerCardProps) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";

  const handleMessage = async () => {
    if (!manager.phoneNumber) {
      Alert.alert('Ошибка', 'Номер телефона не указан');
      return;
    }

    const phoneNumber = manager.phoneNumber.replace(/[^0-9+]/g, '');
    
    let url = '';
    
    if (Platform.OS === 'ios') {
      url = `sms:${phoneNumber}`;
    } else {
      try {
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
        const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);
        
        if (canOpenWhatsapp) {
          url = whatsappUrl;
        } else {
          url = `sms:${phoneNumber}`;
        }
      } catch (error) {
        url = `sms:${phoneNumber}`;
      }
    }
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Написать сообщение',
          `Номер менеджера: ${manager.phoneNumber}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Ошибка при открытии сообщений:', error);
      Alert.alert('Ошибка', 'Не удалось открыть приложение для сообщений');
    }
  };

  const handleCall = async () => {
    if (!manager.phoneNumber) {
      Alert.alert('Ошибка', 'Номер телефона не указан');
      return;
    }

    const phoneNumber = manager.phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${phoneNumber}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Ошибка', 'Невозможно совершить звонок на этом устройстве');
      }
    } catch (error) {
      console.error('Ошибка при звонке:', error);
      Alert.alert('Ошибка', 'Не удалось совершить звонок');
    }
  };
  console.log('manager?.hasReviewed', manager?.hasReviewed)
  return (
    <View style={styles.mainCont}>
      <ThemedView
        style={styles.managerContainer}
        lightColor="#F2F4F7"
        darkColor="#202022"
      >
        <View style={styles.managerRow}>
          <ThemedText
            style={styles.yourManagerText}
            lightColor="#80818B"
            darkColor="#80818B"
          >
            Ваш менеджер
          </ThemedText>

          <TouchableOpacity
            style={styles.changeManagerButton}
            onPress={onChangePress}
            activeOpacity={0.7}
          >
            <RefreshIcon width={20} height={20} />
            <ThemedText
              style={styles.changeManagerText}
              lightColor="#203686"
              darkColor="#FBFCFF"
            >
              Сменить менеджера
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.managerInfo}>
          <View style={styles.avatarContainer}>
            {manager.image ? (
              <Image
                source={{ uri: `${baseUrl}/${manager.image}` }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText style={styles.avatarPlaceholderText}>
                  {manager.name?.charAt(0) || 'М'}
                </ThemedText>
              </View>
            )}
          </View>
          <View style={styles.nameNReviewCont}>
            <View style={styles.nameContainer}>
              <ThemedText
                style={styles.managerName}
                lightColor="#1B1B1C"
                darkColor="#FBFCFF"
                numberOfLines={1}
              >
                {manager.name}
              </ThemedText>
            </View>
            {manager?.hasReviewed ? (
              <ThemedText
                style={styles.alreadyReviewed}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
                numberOfLines={1}
              >
                Вы поставили оценку
              </ThemedText>
            ) : (
              <TouchableOpacity style={styles.chooseReview} onPress={onReviewPress}>
                <ThemedText
                  style={styles.review}
                  lightColor="#203686"
                  darkColor="#4C94FF"
                  numberOfLines={1}
                >
                  Поставить оценку
                </ThemedText>
                <ArrowIconRight />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Контейнер для кнопок */}
        <View style={styles.actionsWrapper}>
          <ThemedView
            style={styles.buttonsContainer}
            lightColor="#FFFFFF"
            darkColor="#2E2E32"
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <View style={styles.buttonContent}>
                <MessageIcon
                  fill={currentTheme === "dark" ? "#FBFCFF" : "#203686"}
                  width={24}
                  height={24}
                />
                <ThemedText
                  style={styles.buttonText}
                  lightColor="#203686"
                  darkColor="#FBFCFF"
                >
                  Написать
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <View style={styles.buttonContent}>
                <PhoneIcon
                  fill={currentTheme === "dark" ? "#FBFCFF" : "#203686"}
                  width={24}
                  height={24}
                />
                <ThemedText
                  style={styles.buttonText}
                  lightColor="#203686"
                  darkColor="#FBFCFF"
                >
                  Позвонить
                </ThemedText>
              </View>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </ThemedView>
    </View>
  );
};

// Карточка для горизонтального списка (для выбора менеджера)
const ManagerSelectCard = ({ manager, onSelect }: ManagerCardProps) => {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      style={[styles.selectCard, isDark && styles.selectCardDark]}
      onPress={() => onSelect?.(manager.id)}
      activeOpacity={0.7}
    >
      <View style={styles.selectAvatarContainer}>
        {manager.image ? (
          <Image
            source={{ uri: `${baseUrl}/${manager.image}` }}
            style={styles.selectAvatar}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.selectAvatar,
              styles.avatarPlaceholderSmall,
              isDark && styles.avatarPlaceholderSmallDark,
            ]}
          >
            <ThemedText style={styles.avatarPlaceholderTextSmall}>
              {manager.name?.charAt(0) || 'М'}
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText
        style={styles.selectManagerName}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
        numberOfLines={2}
      >
        {manager.name}
      </ThemedText>
    </TouchableOpacity>
  );
};

export const ManagerSection = () => {
  const isDark = useColorScheme() === "dark";
  const dispatch = useAppDispatch();
  const { currentCompany, me } = useAppSelector((state) => state.auth);
  const { managers, isLoadingManager } = useAppSelector((state) => state.auth);
  const [showManagerList, setShowManagerList] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fallbackCompany =
    me?.companies?.find((company: any) => company?.type === "individual") ||
    me?.companies?.[0] ||
    null;
  const activeCompany = currentCompany || fallbackCompany;
  const currentManager = activeCompany?.manager || null;

  // Загружаем список менеджеров при необходимости
  useEffect(() => {
    if (showManagerList && managers.length === 0 && !isLoadingManager) {
      dispatch(getMangers());
    }
  }, [showManagerList, managers.length, isLoadingManager, dispatch]);

  // Если currentCompany пустой (часто на этапе PHIS_USER), берем из me.companies
  useEffect(() => {
    if (!currentCompany?.id && fallbackCompany?.id) {
      dispatch(setCompany(fallbackCompany));
    }
  }, [currentCompany?.id, fallbackCompany?.id, dispatch]);

  // Обновляем currentCompany, если изменился me
  useEffect(() => {
    if (me && me.companies && activeCompany?.id) {
      const updatedCompany = me.companies.find(
        (company: any) => company.id === activeCompany.id
      );
      if (updatedCompany && updatedCompany.manager?.id !== activeCompany?.manager?.id) {
        dispatch(setCompany(updatedCompany));
      }
    }
  }, [me?.companies, activeCompany?.id, activeCompany?.manager?.id, dispatch]);

  // Обработчик выбора менеджера
  const handleSelectManager = async (managerId: string) => {
    setIsLoading(true);
    try {
      const storedCompanyRaw = await AsyncStorage.getItem("company");
      const storedCompany = storedCompanyRaw ? JSON.parse(storedCompanyRaw) : null;
      const companyForRequest = storedCompany || activeCompany;
      const shouldSendCompanyId = companyForRequest?.type !== "individual" && !!companyForRequest?.id;

      const params: { managerId: string; companyId?: string } = { managerId };
      if (shouldSendCompanyId) {
        params.companyId = companyForRequest.id;
      }

      await axdef.put('/api/AdditionalInformation/manager', null, {
        params,
      });

      const result = await dispatch(getMyInfo("")).unwrap();
      const myInfo = result?.data?.data;

      if (myInfo?.userType === 0 && myInfo?.individualProfile) {
        const profile = myInfo.individualProfile;
        const fullName = [profile.lastName, profile.firstName, profile.patronymic]
          .filter(Boolean)
          .join(' ')
          .trim();

        const updatedIndividualCompany = {
          id: profile.id,
          name: fullName || activeCompany?.name || "",
          inn: activeCompany?.inn || "",
          foundationDate: profile.birthDate || activeCompany?.foundationDate || "",
          kpp: activeCompany?.kpp || "",
          legalAddress: activeCompany?.legalAddress || "",
          contactPerson: fullName || activeCompany?.contactPerson || "",
          deliveryAddresses: profile.deliveryAddresses || [],
          type: "individual",
          manager: profile.manager || null,
        };

        dispatch(setCompany(updatedIndividualCompany));
      } else if (myInfo?.companies) {
        const updatedCompany = myInfo.companies.find(
          (company: any) => company.id === activeCompany?.id
        );
        if (updatedCompany) {
          dispatch(setCompany(updatedCompany));
        }
      }

      setShowManagerList(false);
    } catch (error) {
      console.error('Ошибка при выборе менеджера:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать менеджера. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  // Если есть текущий менеджер и не показываем список выбора
  console.log('currentManager', currentManager)
  if (currentManager && !showManagerList) {
    return (
      <>
        <CurrentManagerCard
          manager={currentManager}
          onChangePress={() => setShowManagerList(true)}
          onReviewPress={() => setShowReviewModal(true)}
        />
        <ManagerReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          managerId={currentManager.id}
          managerName={currentManager.name}
          managerImage={currentManager.image}
        />
      </>
    );
  }

  // Если нет менеджера или показываем список для выбора
  if (isLoadingManager || isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={isDark ? "#4C94FF" : "#203686"} />
      </View>
    );
  }

  // Показываем список менеджеров для выбора
  if (managers.length > 0) {
    return (
      <View style={styles.managersListContainer}>
        <ThemedText
          style={styles.title}
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
        >
          Выберите своего менеджера
        </ThemedText>
        <FlatList
          data={managers}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <ManagerSelectCard
              manager={item}
              onSelect={handleSelectManager}
            />
          )}
          contentContainerStyle={styles.managersList}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              Список менеджеров пуст
            </ThemedText>
          }
        />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Стили для карточки текущего менеджера
  mainCont: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  managerContainer: {
    width: '100%',
    borderRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 16,
  },
  yourManagerText: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 14,
    fontVariant: ['lining-nums', 'proportional-nums'],
  },
  managerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#6B7280',
  },
  nameNReviewCont: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  alreadyReviewed: {
    fontWeight: '500',
    fontSize: 14,
  },
  chooseReview: {
    display: 'flex',
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  review: {
    fontWeight: '500',
    fontSize: 14,
  },
  managerName: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0,
  },
  // Стили для кнопок
  actionsWrapper: {
    width: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0,
  },
  changeManagerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeManagerText: {
    fontFamily: 'Montserrat',
    fontWeight: '500',
    fontSize: 14,
  },

  // Стили для списка выбора менеджера
  managersListContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 24,
    marginLeft: 16,
  },
  managersList: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
  },
  selectCard: {
    width: 200,
    height: 176,
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    justifyContent: 'center',
  },
  selectCardDark: {
    backgroundColor: '#202022',
  },
  selectAvatarContainer: {
    marginBottom: 8,
  },
  selectAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholderSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderSmallDark: {
    backgroundColor: '#2E2E32',
  },
  avatarPlaceholderTextSmall: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectManagerName: {
    fontFamily: 'Montserrat',
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  loaderContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});

export default ManagerSection;