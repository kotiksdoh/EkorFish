import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";

import { ArrowIconRight, ExitIcon, IconGeo, PencilIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import { clearAuthState, setCompany } from "@/features/auth/authSlice";
import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import { clearCatalogState } from "@/features/catalog/catalogSlice";
import { CompanySelectModal } from "@/features/shared/ui/CompanySelectModal";
import { ProfileEditModal } from "@/features/shared/ui/ProfileEditModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const me = useAppSelector((state) => state.auth.me);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    avatar: null as string | null,
    coverColor: '#ACCBEE',
  });
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);

  // Загружаем сохраненные данные профиля
// Загружаем сохраненные данные профиля
useEffect(() => {
  const loadProfileData = async () => {
    try {
      const savedColorId = await AsyncStorage.getItem('profileCoverColorId');
      const savedAvatar = await AsyncStorage.getItem('profileAvatar');
      
      // Маппинг ID цветов в первый цвет градиента для фона
      const colorToGradientFirst = {
        'light1': '#ACCBEE',
        'light2': '#EEACCF',
        'light3': '#ACEECC',
        'light4': '#EEE2AC',
        'light5': '#CED0D4',
        'dark1': '#697D93',
        'dark2': '#865F74',
        'dark3': '#5A7165',
        'dark4': '#8B8670',
        'dark5': '#515257',
      };
      
      const coverColor = savedColorId ? (colorToGradientFirst[savedColorId as keyof typeof colorToGradientFirst] || '#ACCBEE') : '#ACCBEE';
      
      setProfileData(prev => ({
        ...prev,
        coverColor: coverColor,
        avatar: savedAvatar || null,
      }));
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };
  
  loadProfileData();
}, []);

const handleSaveProfile = async (data: any) => {
  try {
    // Сохраняем в AsyncStorage
    if (data.avatar) {
      await AsyncStorage.setItem('profileAvatar', data.avatar);
    }
    await AsyncStorage.setItem('profileCoverColorId', data.coverColor);
    
    // Маппинг ID цветов в первый цвет градиента для фона
    const colorToGradientFirst = {
      'light1': '#ACCBEE',
      'light2': '#EEACCF',
      'light3': '#ACEECC',
      'light4': '#EEE2AC',
      'light5': '#CED0D4',
      'dark1': '#697D93',
      'dark2': '#865F74',
      'dark3': '#5A7165',
      'dark4': '#8B8670',
      'dark5': '#515257',
    };
    
    const coverColor = colorToGradientFirst[data.coverColor as keyof typeof colorToGradientFirst] || '#ACCBEE';
    
    // Обновляем локальное состояние
    setProfileData(prev => ({
      ...prev,
      name: data.name,
      surname: data.surname,
      avatar: data.avatar,
      coverColor: coverColor,
    }));
    
    setEditModalVisible(false);
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

  // Обновляем данные когда меняется me
  useEffect(() => {
    if (me) {
      const nameParts = getDisplayName().split(' ');
      setProfileData(prev => ({
        ...prev,
        name: nameParts[1] || '',
        surname: nameParts[0] || '',
        email: me?.email || '',
        phone: me?.phoneNumber || '',
      }));
    }
  }, [me]);

  const handleClosePress = () => {
    router.replace("/");
    setLoginModalVisible(false);
  };

  const handleLogin = (phoneNumber: string) => {
    console.log("Login with:", phoneNumber);
    setLoginModalVisible(false);
  };

  useFocusEffect(
    useCallback(() => {
      const checkTokenAndLoad = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("No token found - showing login modal");
          setLoginModalVisible(true);
        }
      };
      checkTokenAndLoad();
    }, []),
  );

  const handleLogout = async () => {
    try {
      dispatch(clearAuthState());
      dispatch(clearCatalogState());
      await AsyncStorage.clear();
      router.replace("/");
    } catch (error) {
      console.error("Ошибка при очистке AsyncStorage:", error);
    }
  };

  const handleSelectCompany = async (company: any) => {
    console.log("Selected company:", company);
    dispatch(setCompany(company));
    setModalVisible(false);
  };

  const getDisplayName = () => {
    if (!me) return "";
    if (me.companies?.length > 0) {
      return currentCompany?.name || me.companies[0]?.name || "";
    }
    const profile = me.individualProfile;
    if (profile) {
      return `${profile.lastName || ""} ${profile.firstName || ""} ${profile.patronymic || ""}`.trim();
    }
    return "";
  };


  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[profileData.coverColor, "#E7F0FD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          {/* Иконка карандаша */}
          <TouchableOpacity 
            style={styles.pencilIconContainer} 
            onPress={() => setEditModalVisible(true)}
          >
            <PencilIcon width={24} height={24} fill="#1B1B1C" />
          </TouchableOpacity>

          {/* Белый блок с фото профиля */}
          <ThemedView style={styles.whiteProfileCard}>
            <View style={styles.profileImageContainer}>
              {profileData.avatar ? (
                <Image 
                  source={{ uri: profileData.avatar }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: profileData.coverColor }]}>
                  <ThemedText style={styles.profileImagePlaceholderText}>
                    {profileData.name?.charAt(0) || ''}{profileData.surname?.charAt(0) || ''}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedView style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>
                TODO
              </ThemedText>
              <ThemedText style={styles.profileEmail}>
                в разработке
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </LinearGradient>

        {/* Информационные блоки */}
        <ThemedView style={styles.infoCard}>
          <View style={styles.infoContainer}>
            <TouchableOpacity style={styles.infoRow} onPress={() => setModalVisible(true)}>
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <IconGeo />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Мои компании
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoRow} onPress={handleLogout}>
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <ExitIcon />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Выйти из аккаунта
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>

      <LoginModal
        visible={loginModalVisible}
        onClose={handleClosePress}
        onLogin={handleLogin}
        enumFlag={"login"}
      />

      <CompanySelectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        companies={me?.companies || []}
        selectedCompanyId={me?.companies[0]?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={() => console.log("Add company pressed")}
      />

      <ProfileEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        initialData={profileData}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
    
  },
  gradientContainer: {
    width: "100%",
    height: 250,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  pencilIconContainer: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  whiteProfileCard: {
    width: "100%",
    maxWidth: 402,
    height: 119,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 0,

    position: "relative",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    position: "absolute",
    top: -70,
    left: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
    // marginLeft: 100, // Отступ после фото
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: Fonts.rounded,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    fontFamily: Fonts.rounded,
  },
  infoCard: {
    borderRadius: 24,
    padding: 16,
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    width: "100%",
  },
  iconPlaceholder: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
    marginTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "60%",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1B1B1C",
    textAlign: "right",
  },
  emptyWhiteBlock: {
    width: "90%",
    alignSelf: "center",
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});