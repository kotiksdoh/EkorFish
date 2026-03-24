// features/shared/ui/ManagerSection.tsx
import { MessageIcon, PhoneIcon, RefreshIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMangers, getMyInfo, setCompany } from '@/features/auth/authSlice';
import { axdef, baseUrl } from '@/features/shared/services/axios';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

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
}

// Карточка для отображения текущего менеджера (с кнопками)
const CurrentManagerCard = ({ manager, onChangePress }: ManagerCardProps) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";

  const handleMessage = () => {
    // TODO: Реализовать отправку сообщения
    console.log('Написать сообщение менеджеру:', manager.id);
  };

  const handleCall = () => {
    // TODO: Реализовать звонок
    console.log('Позвонить менеджеру:', manager.phoneNumber);
  };

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

        <View style={styles.nameContainer}>
          <ThemedText
            style={styles.managerName}
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            numberOfLines={2}
          >
            {manager.name}
          </ThemedText>
          
        </View>
      </View>

      {/* Контейнер для кнопок - теперь будет растягиваться на всю ширину */}
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
  return (
    <TouchableOpacity
      style={styles.selectCard}
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
          <View style={[styles.selectAvatar, styles.avatarPlaceholderSmall]}>
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
  const dispatch = useAppDispatch();
  const { currentCompany, me } = useAppSelector((state) => state.auth);
  const { managers, isLoadingManager } = useAppSelector((state) => state.auth);
  const [showManagerList, setShowManagerList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentManager = currentCompany?.manager || null;

  // Загружаем список менеджеров при необходимости
  useEffect(() => {
    if (showManagerList && managers.length === 0 && !isLoadingManager) {
      dispatch(getMangers());
    }
  }, [showManagerList, managers.length, isLoadingManager, dispatch]);

  // Обновляем currentCompany, если изменился me
  useEffect(() => {
    if (me && me.companies && currentCompany?.id) {
      // Находим обновленную компанию в me.companies
      const updatedCompany = me.companies.find(
        (company: any) => company.id === currentCompany.id
      );
      
      // Если компания найдена и менеджер изменился, обновляем currentCompany
      if (updatedCompany && updatedCompany.manager?.id !== currentCompany?.manager?.id) {
        console.log('Обновляем currentCompany с новым менеджером:', updatedCompany.manager);
        dispatch(setCompany(updatedCompany));
      }
    }
  }, [me, currentCompany?.id, dispatch]);

  // Обработчик выбора менеджера
  const handleSelectManager = async (managerId: string) => {
    setIsLoading(true);
    try {
      // Отправляем PUT запрос на выбор менеджера
      await axdef.put('/api/AdditionalInformation/manager', null, {
        params: {
          managerId: managerId,
          companyId: currentCompany?.id,
        },
      });

      // После успешного выбора, обновляем данные пользователя
      const result = await dispatch(getMyInfo("")).unwrap();
      
      // Обновляем currentCompany из полученных данных
      if (result?.data?.data?.companies) {
        const updatedCompany = result.data.data.companies.find(
          (company: any) => company.id === currentCompany?.id
        );
        if (updatedCompany) {
          dispatch(setCompany(updatedCompany));
        }
      }

      // Закрываем список и показываем выбранного менеджера
      setShowManagerList(false);
    } catch (error) {
      console.error('Ошибка при выборе менеджера:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Если есть текущий менеджер и не показываем список выбора
  if (currentManager && !showManagerList) {
    return (
      <CurrentManagerCard
        manager={currentManager}
        onChangePress={() => setShowManagerList(true)}
      />
    );
  }

  // Если нет менеджера или показываем список для выбора
  if (isLoadingManager || isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#203686" />
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
  nameContainer: {
    flex: 1,
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