import { ArrowIconRight, LogoIcon, PhoneIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getHeplListThunk } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { WebView } from "react-native-webview";
import { PrimaryButton } from "./components/PrimartyButton";

// Иконки
const TelegramIcon = ({ fill }: { fill: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.6-1.38-.97-2.23-1.56-.99-.69-.35-1.07.22-1.69.15-.15 2.71-2.48 2.76-2.69.01-.03.02-.14-.05-.2-.07-.06-.18-.04-.26-.02-.11.02-1.86 1.18-5.25 3.47-.5.34-.95.51-1.35.5-.44-.01-1.3-.25-1.94-.46-.78-.25-1.4-.38-1.35-.81.03-.22.33-.45.91-.68 3.59-1.56 5.98-2.59 7.18-3.09 3.42-1.42 4.13-1.67 4.59-1.68.1 0 .33.02.48.15.12.1.16.25.17.36.01.11 0 .24-.01.37z"
      fill={fill}
    />
  </svg>
);

const EmailIcon = ({ fill }: { fill: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
      fill={fill}
    />
  </svg>
);

interface HelpProps {
  visible: boolean;
  onClose: () => void;
}

type ScreenState = 'main' | 'helpList' | 'about' | 'helpContent';
type SupportModalState = 'hidden' | 'visible';

const SUPPORT_CONFIG = {
  phone: "+7 (999) 123-45-67",
  telegram: "https://t.me/support_bot",
  email: "support@example.com",
};

const ABOUT_CONFIG = {
  version: "1.2.3",
  build: "456",
  lastUpdate: "12.12.2024",
  cacheSize: "245 МБ",
};

export const HelpModal: React.FC<HelpProps> = ({ visible, onClose }) => {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const helpList = useAppSelector((state) => state.auth.helpList);
  const loading = useAppSelector((state) => state.auth.isLoadingHelp);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const [screenState, setScreenState] = useState<ScreenState>('main');
  const [supportModalState, setSupportModalState] = useState<SupportModalState>('hidden');
  const [currentHelpObject, setCurrentHelpObject] = useState<{
    type: string;
    currentHtml: string;
  } | null>(null);

  const handleBack = useCallback(() => {
    if (currentHelpObject) {
      setCurrentHelpObject(null);
      setScreenState('helpList');
    } else if (screenState === 'helpList') {
      setScreenState('main');
    } else if (screenState === 'about') {
      setScreenState('main');
    } else {
      onClose();
    }
  }, [currentHelpObject, screenState, onClose]);

  const handleCloseAll = useCallback(() => {
    if (currentHelpObject) {
      setCurrentHelpObject(null);
      setScreenState('helpList');
    } else if (screenState !== 'main') {
      setScreenState('main');
    } else if (supportModalState === 'visible') {
      setSupportModalState('hidden');
    } else {
      onClose();
    }
  }, [currentHelpObject, screenState, supportModalState, onClose]);

  const loadHelpList = useCallback(() => {
    if (helpList.length > 0) {
      setScreenState('helpList');
    } else {
      dispatch(getHeplListThunk()).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          setScreenState('helpList');
        }
      });
    }
  }, [helpList.length, dispatch]);

  const onCkickHelp = useCallback((
    helpItem: { type: string; items: { title: string; htmlText: string }[] },
    currentHtml: string,
  ) => {
    setCurrentHelpObject({ type: helpItem.type, currentHtml });
    setScreenState('helpContent');
  }, []);

  const handlePhonePress = useCallback(() => {
    Linking.openURL(`tel:${SUPPORT_CONFIG.phone.replace(/[^\d+]/g, "")}`);
  }, []);

  const handleTelegramPress = useCallback(() => {
    Linking.openURL(SUPPORT_CONFIG.telegram);
  }, []);

  const handleEmailPress = useCallback(() => {
    Linking.openURL(`mailto:${SUPPORT_CONFIG.email}`);
  }, []);

  const handleFaqPress = useCallback(() => {
    setSupportModalState('hidden');
    loadHelpList();
  }, [loadHelpList]);

  const getHeaderTitle = useCallback(() => {
    if (currentHelpObject) {
      return currentHelpObject.type[0].toUpperCase() + currentHelpObject.type.slice(1);
    }
    switch (screenState) {
      case 'helpList': return "Помощь";
      case 'about': return "О приложении";
      default: return "Помощь и приложение";
    }
  }, [currentHelpObject, screenState]);

  const renderMainScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.contentContainer}>
      <View>
        <TouchableOpacity onPress={loadHelpList} activeOpacity={0.7}>
          <View style={[styles.menuRow, { borderColor: isDark ? "#252527" : "#F0F3F7" }]}>
            <ThemedText>Помощь</ThemedText>
            <ArrowIconRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSupportModalState('visible')} activeOpacity={0.7}>
          <View style={[styles.menuRow, { borderColor: isDark ? "#252527" : "#F0F3F7" }]}>
            <ThemedText>Поддержка</ThemedText>
            <ArrowIconRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreenState('about')} activeOpacity={0.7}>
          <View style={[styles.menuRow, { borderColor: isDark ? "#252527" : "#F0F3F7" }]}>
            <ThemedText>О приложении</ThemedText>
            <ArrowIconRight />
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderHelpListScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.contentContainer}>
      {helpList.map((helpObj) => (
        <View style={styles.helpSection} key={helpObj.type}>
          <ThemedText type="subtitle" darkColor="#FBFCFF" lightColor="#1B1B1C">
            {helpObj.type[0].toUpperCase() + helpObj.type.slice(1)}
          </ThemedText>
          {helpObj.items.map((helpItem, index) => {
            const isLast = index === helpObj.items.length - 1;
            return (
              <TouchableOpacity
                key={helpItem.title}
                onPress={() => onCkickHelp(helpObj, helpItem.htmlText)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuRow,
                    !isLast && {
                      borderColor: isDark ? "#252527" : "#F0F3F7",
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <ThemedText darkColor="#FBFCFF" lightColor="#1B1B1C">
                    {helpItem.title}
                  </ThemedText>
                  <ArrowIconRight />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ThemedView>
  );

  const renderAboutScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.aboutContainer}>
      <LogoIcon />
      <View style={styles.aboutInfo}>
        <ThemedText darkColor="#FBFCFF">Версия: {ABOUT_CONFIG.version} (build {ABOUT_CONFIG.build})</ThemedText>
        <ThemedText darkColor="#FBFCFF">Последнее обновление: {ABOUT_CONFIG.lastUpdate}</ThemedText>
        <ThemedText darkColor="#FBFCFF">Размер кэша: {ABOUT_CONFIG.cacheSize}</ThemedText>
      </View>
      <View style={styles.aboutLinks}>
        <ThemedText darkColor="#4C94FF">Лицензионное соглашение</ThemedText>
        <ThemedText darkColor="#4C94FF">Пользовательское соглашение</ThemedText>
        <ThemedText darkColor="#4C94FF">Политика конфиденциальности</ThemedText>
      </View>
    </ThemedView>
  );

  const renderHelpContentScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.contentContainer}>
      {currentHelpObject && (
        <WebView
          originWhitelist={["*"]}
          source={{ html: currentHelpObject.currentHtml }}
          javaScriptEnabled={true}
          style={styles.webView}
        />
      )}
    </ThemedView>
  );

  const renderSupportModal = () => (
    <Modal
      visible={supportModalState === 'visible'}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSupportModalState('hidden')}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.modalContent}>
          <TouchableOpacity style={styles.swipeHandleContainer} onPress={() => setSupportModalState('hidden')}>
            <View style={styles.swipeHandle} />
          </TouchableOpacity>

          <View style={styles.supportContent}>
            <ThemedText type="subtitle">Поддержка</ThemedText>
            <ThemedText>Выберите удобный способ связи</ThemedText>

            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactButton} onPress={handlePhonePress}>
                <View style={[styles.contactIcon, { backgroundColor: "#3881EE" }]}>
                  <PhoneIcon fill="#FBFCFF" />
                </View>
                <ThemedText style={styles.contactLabel}>Звонок</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={handleTelegramPress}>
                <View style={[styles.contactIcon, { backgroundColor: "#26A5E4" }]}>
                  <TelegramIcon fill="#FBFCFF" />
                </View>
                <ThemedText style={styles.contactLabel}>Telegram</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
                <View style={[styles.contactIcon, { backgroundColor: "#EA4335" }]}>
                  <EmailIcon fill="#FBFCFF" />
                </View>
                <ThemedText style={styles.contactLabel}>Email</ThemedText>
              </TouchableOpacity>
            </View>

            <PrimaryButton title="Перейти в FAQ" onPress={handleFaqPress} />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );

  const renderCurrentScreen = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
          <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
        </View>
      );
    }

    switch (screenState) {
      case 'main': return renderMainScreen();
      case 'helpList': return renderHelpListScreen();
      case 'about': return renderAboutScreen();
      case 'helpContent': return renderHelpContentScreen();
      default: return renderMainScreen();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCloseAll}
      statusBarTranslucent={true}
    >
      <ThemedView lightColor="#EBEDF0" darkColor="#040508" style={styles.modalContainer}>
        <ModalHeader title={getHeaderTitle()} showBackButton onBackPress={handleBack} />
        {renderCurrentScreen()}
        {renderSupportModal()}
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  helpSection: {
    marginBottom: 32,
    gap: 4,
  },
  aboutContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 64,
    borderRadius: 12,
    marginTop: 8,
  },
  aboutInfo: {
    alignItems: "center",
    gap: 8,
  },
  aboutLinks: {
    alignItems: "center",
    gap: 28,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  supportContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 24,
  },
  contactRow: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  contactButton: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  contactIcon: {
    borderRadius: 12,
    padding: 12,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontSize: 12,
  },
});