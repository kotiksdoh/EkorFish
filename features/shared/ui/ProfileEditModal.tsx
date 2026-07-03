import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import {
  getCategoryItems,
  getSliderItems,
} from "@/features/auth/authSlice";
import { clearAuthSession } from "@/features/auth/services/clearAuthSession";
import { axdef } from "@/features/shared/services/axios";
import { AppModal } from "@/features/shared/ui/AppModal";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { useAppDispatch } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatPhoneProfile,
  isEmailLogin,
} from "@/features/shared/utils/phoneLinking";
import AnimatedTextInput from "./components/CustomInput";

const { height: screenHeight } = Dimensions.get("window");

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; surname: string; coverColor: string; avatar: string | null }) => void;
  initialData: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    avatar: string | null;
    coverColor: string;
  };
}

// Цвета для светлой темы
const LIGHT_COLORS = [
  { 
    id: 'light1', 
    gradient: ['#ACCBEE', '#E7F0FD'] as const, 
    label: 'Голубой',
    preview: '#ACCBEE'
  },
  { 
    id: 'light2', 
    gradient: ['#EEACCF', '#FDE7F2'] as const, 
    label: 'Розовый',
    preview: '#EEACCF'
  },
  { 
    id: 'light3', 
    gradient: ['#ACEECC', '#E7FDF0'] as const, 
    label: 'Зеленый',
    preview: '#ACEECC'
  },
  { 
    id: 'light4', 
    gradient: ['#EEE2AC', '#FDF6E7'] as const, 
    label: 'Желтый',
    preview: '#EEE2AC'
  },
  { 
    id: 'light5', 
    gradient: ['#CED0D4', '#E9ECF0'] as const, 
    label: 'Серый',
    preview: '#CED0D4'
  },
];

// Цвета для темной темы
const DARK_COLORS = [
  { 
    id: 'dark1', 
    gradient: ['#697D93', '#95A0B0'] as const, 
    label: 'Синий',
    preview: '#697D93'
  },
  { 
    id: 'dark2', 
    gradient: ['#865F74', '#B9A2AE'] as const, 
    label: 'Розовый',
    preview: '#865F74'
  },
  { 
    id: 'dark3', 
    gradient: ['#5A7165', '#849C8E'] as const, 
    label: 'Зеленый',
    preview: '#5A7165'
  },
  { 
    id: 'dark4', 
    gradient: ['#8B8670', '#BBB5A8'] as const, 
    label: 'Желтый',
    preview: '#8B8670'
  },
  { 
    id: 'dark5', 
    gradient: ['#515257', '#76797D'] as const, 
    label: 'Серый',
    preview: '#515257'
  },
];

const ALL_COVER_COLORS = [...LIGHT_COLORS, ...DARK_COLORS];

function resolveColorIdForTheme(
  savedId: string,
  themeColors: typeof LIGHT_COLORS,
): string {
  const paletteIndex = ALL_COVER_COLORS.findIndex((color) => color.id === savedId);
  if (paletteIndex >= 0) {
    return themeColors[paletteIndex % themeColors.length]?.id ?? themeColors[0].id;
  }
  return themeColors[0].id;
}

function resolveColorIdFromHex(
  hex: string | undefined,
  themeColors: typeof LIGHT_COLORS,
): string | null {
  if (!hex) return null;
  const normalized = hex.trim().toUpperCase();
  const matchedIndex = ALL_COVER_COLORS.findIndex(
    (color) =>
      color.preview.toUpperCase() === normalized ||
      color.gradient[0].toUpperCase() === normalized,
  );
  if (matchedIndex < 0) return null;
  return themeColors[matchedIndex % themeColors.length]?.id ?? null;
}

export const ProfileEditModal = ({
  visible,
  onClose,
  onSave,
  initialData,
}: ProfileEditModalProps) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Выбираем цвета в зависимости от темы
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(initialData.avatar || null);
  const [selectedColorId, setSelectedColorId] = useState(colors[0].id);
  const [pickerColorId, setPickerColorId] = useState(colors[0].id);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isIndividualProfile, setIsIndividualProfile] = useState(false);
  const wasVisibleRef = useRef(false);
  
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const colorPickerTranslateY = useRef(new Animated.Value(screenHeight)).current;

  // Получаем текущий выбранный цвет
  const getSelectedColor = () => {
    const color = colors.find(c => c.id === selectedColorId);
    return color || colors[0];
  };

  const selectedColor = getSelectedColor();

  const loginRaw = useMemo(
    () => initialData.phone || initialData.email || "",
    [initialData.phone, initialData.email],
  );
  const isPhoneLogin = Boolean(loginRaw) && !isEmailLogin(loginRaw);
  const loginPlaceholder = isPhoneLogin ? "Номер" : "Почта";
  const loginDisplayValue = isPhoneLogin
    ? formatPhoneProfile(loginRaw)
    : loginRaw;

  const handleLogout = useCallback(async () => {
    onClose();

    try {
      try {
        const deviceId = await AsyncStorage.getItem("device_id");
        await axdef.post("/api/Account/logout", {
          deviceId: deviceId || "",
        });
      } catch (logoutError) {
        console.error("Ошибка при вызове logout API:", logoutError);
      }

      await clearAuthSession();
      await Promise.all([
        dispatch(getCategoryItems("")).unwrap(),
        dispatch(getSliderItems("")).unwrap(),
      ]);
      router.replace("/");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  }, [dispatch, onClose, router]);

  // Анимация появления основной модалки
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

  // Анимация появления модалки выбора цвета
  useEffect(() => {
    if (showColorPicker) {
      colorPickerTranslateY.setValue(screenHeight);
      Animated.spring(colorPickerTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    }
  }, [showColorPicker]);

  const closeModalWithAnimation = () => {
    if (isClosing) return;

    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsClosing(false);
      setShowColorPicker(false);
      onClose();
    });
  };

  const closeColorPickerWithAnimation = () => {
    Animated.timing(colorPickerTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowColorPicker(false);
    });
  };

  const openColorPicker = () => {
    setPickerColorId(selectedColorId);
    setShowColorPicker(true);
  };

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedColorId = await AsyncStorage.getItem('profileCoverColorId');
        const savedAvatar = await AsyncStorage.getItem('profileAvatar');
        const storedCompany = await AsyncStorage.getItem("company");

        let nextColorId = resolveColorIdFromHex(initialData.coverColor, colors);
        if (savedColorId) {
          nextColorId = resolveColorIdForTheme(savedColorId, colors);
        }
        setSelectedColorId(nextColorId);
        setPickerColorId(nextColorId);
        
        if (savedAvatar) setAvatar(savedAvatar);

        if (storedCompany) {
          const parsedCompany = JSON.parse(storedCompany);
          setIsIndividualProfile(parsedCompany?.type === "individual");
        } else {
          setIsIndividualProfile(false);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    if (visible && !wasVisibleRef.current) {
      void loadSavedData();
      setName(initialData.name || "");
      setSurname(initialData.surname || "");
    }

    if (!visible) {
      setShowColorPicker(false);
    }

    wasVisibleRef.current = visible;
  }, [visible, initialData.name, initialData.surname, initialData.coverColor, colors]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    // Получаем полный объект цвета по ID
    const selectedColorObj = colors.find(c => c.id === selectedColorId);
    
    onSave({
      name,
      surname,
      coverColor: selectedColorId, // Сохраняем ID
      avatar,
    });
    
    // Также сохраняем первый цвет градиента для фона
    if (selectedColorObj) {
      // Опционально: сохраняем первый цвет градиента для фона
      AsyncStorage.setItem('profileCoverGradientFirst', selectedColorObj.gradient[0]);
    }
  };

  const handleColorSelect = async (colorId: string) => {
    setSelectedColorId(colorId);
    setPickerColorId(colorId);
    await AsyncStorage.setItem('profileCoverColorId', colorId);
    closeColorPickerWithAnimation();
  };

  return (
    <>
      {/* Основная модалка */}
      <AppModal
        visible={visible}
        animationType="none"
        statusBarTranslucent={true}
        transparent={true}
        onRequestClose={() => {
          if (showColorPicker) {
            closeColorPickerWithAnimation();
            return;
          }
          closeModalWithAnimation();
        }}
      >
        <TouchableWithoutFeedback onPress={closeModalWithAnimation}>
          <View style={styles.fullModalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.fullModalContainer,
                  isDarkMode && {
                    backgroundColor: "#202022",
                  },
                  {
                    transform: [{ translateY: modalTranslateY }],
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={closeModalWithAnimation}>
                    <ThemedText lightColor="#203686" darkColor="#4C94FF" style={styles.cancelButton}>Отмена</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave}>
                    <ThemedText lightColor="#203686" darkColor="#4C94FF" style={styles.doneButton}>Готово</ThemedText>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Photo Section */}
                  <View style={styles.photoSection}>
                    <View style={styles.avatarContainer}>
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                      ) : (
                        <LinearGradient
                          colors={selectedColor.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.avatarPlaceholder}
                        />
                      )}
                    </View>
                    {!isIndividualProfile && (
                      <TouchableOpacity onPress={pickImage}>
                        <ThemedText style={styles.changePhotoText}>Выбрать фотографию</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Inputs */}
                  <ThemedView lightColor="#FFFFFF" darkColor='#151516' style={styles.inputsCard}>
                    {isIndividualProfile ? (
                      <>
                        <AnimatedTextInput
                          placeholder="Имя"
                          placeholderTextColor="#80818B"
                          value={name}
                          onChangeText={setName}
                          editable={false}
                        />
                        <AnimatedTextInput
                          placeholder="Фамилия"
                          placeholderTextColor="#80818B"
                          value={surname}
                          onChangeText={setSurname}
                          editable={false}
                        />
                      </>
                    ) : (
                      <AnimatedTextInput
                        placeholder="Наименование компании"
                        placeholderTextColor="#80818B"
                        value={name}
                        onChangeText={setName}
                        editable={false}
                      />
                    )}
                  </ThemedView>

                    <ThemedView lightColor="#FFFFFF" darkColor='#151516' style={styles.colorPickerTrigger}>
                      <AnimatedTextInput
                        placeholder={loginPlaceholder}
                        placeholderTextColor="#80818B"
                        value={loginDisplayValue}
                        editable={false}
                      />
         
                        <TouchableOpacity style={styles.colorPickerCont} onPress={openColorPicker}>
                          
                        <ThemedText style={styles.colorPickerLabel}>Изменить цвет обложки</ThemedText>
                        <View style={styles.colorPickerRight}>
                          <LinearGradient
                            colors={selectedColor.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.colorCircle}
                          />
                          <ArrowIconRight />
                        </View>
                       </TouchableOpacity>

                    </ThemedView>

                    <ThemedView lightColor="#FFFFFF" darkColor='#151516' style={styles.BottomCard}>
                      <PrimaryButton
                        title="Выйти"
                        onPress={handleLogout}
                        variant="third"
                        size="md"
                        loading={false}
                        activeOpacity={0.8}
                        fullWidth
                        customTextColor={'#F10B34'}
                      />
                    </ThemedView>
                </ScrollView>

                {showColorPicker ? (
                  <TouchableWithoutFeedback onPress={closeColorPickerWithAnimation}>
                    <View style={styles.innerOverlay}>
                      <TouchableWithoutFeedback>
                        <Animated.View
                          style={[
                            styles.colorPickerModal,
                            isDarkMode && {
                              backgroundColor: "#202022",
                            },
                            {
                              transform: [{ translateY: colorPickerTranslateY }],
                            },
                          ]}
                        >
                          {/* Защелка для свайпа */}
                          <TouchableOpacity
                            style={styles.swipeHandleContainer}
                            activeOpacity={0.7}
                            onPress={closeColorPickerWithAnimation}
                          >
                            <View style={[styles.swipeHandle, isDarkMode && { backgroundColor: '#404040' }]} />
                          </TouchableOpacity>

                          <View style={styles.colorPickerHeader}>
                            <ThemedText style={styles.colorPickerModalTitle}>
                              Изменить цвет обложки
                            </ThemedText>
                          </View>

                          <View style={styles.colorsGrid}>
                            {colors.map((color) => {
                              const isSelected = pickerColorId === color.id;
                              return (
                              <TouchableOpacity
                                key={color.id}
                                style={styles.colorOption}
                                onPress={() => setPickerColorId(color.id)}
                                activeOpacity={0.85}
                              >
                                <LinearGradient
                                  colors={color.gradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.colorOptionGradient}
                                />
                                {isSelected ? (
                                  <View
                                    style={[
                                      styles.colorOptionSelectedRing,
                                      isDarkMode && styles.colorOptionSelectedRingDark,
                                    ]}
                                  />
                                ) : null}
                              </TouchableOpacity>
                            );
                            })}
                          </View>

                          <View
                            style={[
                              styles.buttonsContainer,
                              {
                                paddingBottom: 16 + Math.max(insets.bottom, 24),
                              },
                            ]}
                          >
                            <PrimaryButton
                              title="Применить"
                              onPress={() => handleColorSelect(pickerColorId)}
                              variant="primary"
                              size="md"
                              fullWidth
                            />
                          </View>
                        </Animated.View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                ) : null}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </AppModal>
    </>
  );
};

const styles = StyleSheet.create({
  fullModalOverlay: {
    flex: 1,
  },
  fullModalContainer: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#EBEDF0'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  innerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cancelButton: {
    fontSize: 16,
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputsCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 16
  },
  BottomCard:{
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 16,
    marginTop: 16,
  },
  colorPickerTrigger: {
    flexDirection: 'column',
    // alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 16
  },
  colorPickerCont: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingLeft: 6
    // alignItems: 'center',
  },
  colorPickerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorPickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  // Стили для модалки выбора цвета
  colorPickerModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  colorPickerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    // alignItems: 'center',
  },
  colorPickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.rounded,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
  },
  colorOptionGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionSelectedRing: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: "#203686",
  },
  colorOptionSelectedRingDark: {
    borderColor: "#3881EE",
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
});