// features/home/components/HomeHeader.tsx
import { LemonIcon, PersonCircleIcon } from '@/assets/icons/icons.js';
import { ThemedText } from '@/components/themed-text';
import { CompanySelectModal } from '@/features/shared/ui/CompanySelectModal';
import { useAppSelector } from '@/store/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

interface HomeHeaderProps {
  title?: string;
  transparent?: boolean;
  onLoginPress?: () => void;
  onAddCompanyPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  title = 'EkorFish',
  transparent = true,
  onLoginPress,
  onAddCompanyPress,
}) => {
  const me = useAppSelector((state) => state.auth.me);
  const [modalVisible, setModalVisible] = useState(false);
  const systemTheme = useColorScheme(); 
  const currentTheme = systemTheme || 'light';
  const codeBackgroundColor = currentTheme === 'dark' ? '#202022' : '#F2F4F7';
  const [displayName, setDisplayName] = useState('');

  const handleSelectCompany = async (company: any) => {
    console.log('Selected company:', company);
    try {
      await AsyncStorage.setItem("company", JSON.stringify(company));
      console.log('Company saved to AsyncStorage');
      // Обновляем отображаемое имя после выбора компании
      await updateDisplayName();
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const updateDisplayName = useCallback(async () => {
    if (!me) {
      setDisplayName('');
      return;
    }
    
    if (me.companies?.length > 0) {
      const selectedComp = await AsyncStorage.getItem('company');
      if (selectedComp) {
        setDisplayName(JSON.parse(selectedComp)?.name || '');
      } else if (me.companies[0]) {
        setDisplayName(me.companies[0].name);
      }
    } else {
      const profile = me.individualProfile;
      if (profile) {
        const name = `${profile.firstName || ''} ${profile.lastName || ''} ${profile.patronymic || ''}`.trim();
        setDisplayName(name);
      }
    }
  }, [me]);

  useEffect(() => {
    updateDisplayName();
  }, [me, updateDisplayName]);

  return (
    <>
      <View style={[
        styles.header,
        transparent && styles.headerTransparent
      ]}>
        {me === null ? (
          <View style={styles.headerContent}>
            <View></View>
            <TouchableOpacity
              style={[{ backgroundColor: codeBackgroundColor }, styles.loginButton]}
              onPress={onLoginPress}
              activeOpacity={0.7}
            >
              <ThemedText darkColor='#FBFCFF' lightColor='#1B1B1C' style={styles.loginButtonText}>
                Войти
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headInfo}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <PersonCircleIcon/>
              <ThemedText 
                lightColor='#FBFCFF' 
                darkColor='#FBFCFF'
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ maxWidth: 150 }}
              >
                {displayName}
              </ThemedText>
            </TouchableOpacity>
            
            <View style={styles.headInfoBonus}>
              <LemonIcon/>
              <ThemedText lightColor='#FBFCFF' darkColor='#FBFCFF'>222</ThemedText>
            </View>
          </View>
        )}
      </View>

      <CompanySelectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        companies={me?.companies || []}
        selectedCompanyId={me?.companies[0]?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={onAddCompanyPress || (() => {
          // Здесь можно открыть модалку регистрации компании
          console.log('Add company pressed');
        })}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(32, 54, 134, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headInfo: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headInfoBonus: {
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  }
});