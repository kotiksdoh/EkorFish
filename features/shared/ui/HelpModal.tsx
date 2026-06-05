import { ArrowIconRight, LogoIcon, SupportEmailIcon, SupportPhoneIcon, SupportTelegramIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getHeplListThunk, getMyParams } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { openPhoneDialer } from "@/features/shared/utils/phoneLinking";
import {
  getAppVersionInfo,
  loadAppAboutDynamicInfo,
} from "@/features/shared/utils/appAboutInfo";
import {
  getSupportContactsFromParams,
  normalizeTelegramUrl,
} from "@/features/shared/utils/supportParams";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LegalDocumentId } from "@/features/shared/legal/buildLegalHtml";
import { HtmlContentViewer } from "@/features/shared/ui/HtmlContentViewer";
import { getLegalDocumentTitle, LegalDocumentViewer } from "@/features/shared/ui/LegalDocumentViewer";
import { PrimaryButton } from "./components/PrimartyButton";
import { SnapBottomSheet } from "./SnapBottomSheet";

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

type ScreenState = 'main' | 'helpList' | 'about' | 'helpContent' | 'legalDocument';
type SupportModalState = 'hidden' | 'visible';

export const HelpModal: React.FC<HelpProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";
  const scrollBottomPadding = Math.max(insets.bottom, 16) + 24;

  const helpList = useAppSelector((state) => state.auth.helpList);
  const loading = useAppSelector((state) => state.auth.isLoadingHelp);
  const authParams = useAppSelector((state) => state.auth.params);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const supportContacts = useMemo(
    () => getSupportContactsFromParams(authParams),
    [authParams],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    void dispatch(getMyParams(""));
  }, [visible, dispatch]);

  const [screenState, setScreenState] = useState<ScreenState>('main');
  const [supportModalState, setSupportModalState] = useState<SupportModalState>('hidden');
  const [currentHelpObject, setCurrentHelpObject] = useState<{
    type: string;
    title: string;
    currentHtml: string;
  } | null>(null);
  const [legalDocumentId, setLegalDocumentId] = useState<LegalDocumentId | null>(null);
  const versionInfo = useMemo(() => getAppVersionInfo(), []);
  const [aboutInfo, setAboutInfo] = useState({
    lastUpdate: "Загрузка...",
    cacheSize: "Загрузка...",
  });

  useEffect(() => {
    if (screenState !== "about") {
      return;
    }

    let isMounted = true;

    const loadAboutInfo = async () => {
      setAboutInfo({
        lastUpdate: "Загрузка...",
        cacheSize: "Загрузка...",
      });

      const dynamicInfo = await loadAppAboutDynamicInfo();
      if (isMounted) {
        setAboutInfo(dynamicInfo);
      }
    };

    void loadAboutInfo();

    return () => {
      isMounted = false;
    };
  }, [screenState]);

  const handleBack = useCallback(() => {
    if (currentHelpObject) {
      setCurrentHelpObject(null);
      setScreenState('helpList');
    } else if (screenState === 'legalDocument') {
      setLegalDocumentId(null);
      setScreenState('about');
    } else if (screenState === 'helpList') {
      setScreenState('main');
    } else if (screenState === 'about') {
      setScreenState('main');
    } else {
      onClose();
    }
  }, [currentHelpObject, screenState, onClose]);

  const openLegalDocument = useCallback((documentId: LegalDocumentId) => {
    setLegalDocumentId(documentId);
    setScreenState('legalDocument');
  }, []);

  const handleCloseAll = useCallback(() => {
    if (currentHelpObject) {
      setCurrentHelpObject(null);
      setScreenState('helpList');
    } else if (screenState === 'legalDocument') {
      setLegalDocumentId(null);
      setScreenState('about');
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
    helpObj: { type: string; items: { title: string; htmlText: string }[] },
    helpItem: { title: string; htmlText: string },
  ) => {
    setCurrentHelpObject({
      type: helpObj.type,
      title: helpItem.title,
      currentHtml: helpItem.htmlText,
    });
    setScreenState('helpContent');
  }, []);

  const handlePhonePress = useCallback(() => {
    void openPhoneDialer({ phoneNumber: supportContacts.phone });
  }, [supportContacts.phone]);

  const handleTelegramPress = useCallback(async () => {
    const telegramUrl = normalizeTelegramUrl(supportContacts.telegram);
    if (!telegramUrl) {
      Alert.alert("Ошибка", "Контакт Telegram не указан");
      return;
    }

    try {
      await Linking.openURL(telegramUrl);
    } catch (error) {
      console.error("Ошибка при открытии Telegram:", error);
      Alert.alert("Ошибка", "Не удалось открыть Telegram");
    }
  }, [supportContacts.telegram]);

  const handleEmailPress = useCallback(async () => {
    if (!supportContacts.email) {
      Alert.alert("Ошибка", "Email не указан");
      return;
    }

    try {
      await Linking.openURL(`mailto:${supportContacts.email}`);
    } catch (error) {
      console.error("Ошибка при открытии почты:", error);
      Alert.alert("Ошибка", "Не удалось открыть почтовое приложение");
    }
  }, [supportContacts.email]);

  const handleFaqPress = useCallback(() => {
    setSupportModalState('hidden');
    loadHelpList();
  }, [loadHelpList]);

  const getHeaderTitle = useCallback(() => {
    if (currentHelpObject) {
      return currentHelpObject.title;
    }
    if (screenState === 'legalDocument' && legalDocumentId) {
      return getLegalDocumentTitle(legalDocumentId);
    }
    switch (screenState) {
      case 'helpList': return "Помощь";
      case 'about': return "О приложении";
      default: return "Помощь и приложение";
    }
  }, [currentHelpObject, screenState, legalDocumentId]);

  const renderMainScreen = () => (
    <ThemedView lightColor="transparent" darkColor="transparent" style={styles.contentContainer}>
      <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.mainMenuCard}>
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
      </ThemedView>
    </ThemedView>
  );

  const renderHelpListScreen = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: scrollBottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.helpListCard}>
        {helpList.map((helpObj) => (
          <View style={styles.helpSection} key={helpObj.type}>
            <ThemedText
              type="subtitle"
              darkColor="#FBFCFF"
              lightColor="#1B1B1C"
              style={styles.helpSectionTitle}
            >
              {helpObj.type[0].toUpperCase() + helpObj.type.slice(1)}
            </ThemedText>
            {helpObj.items.map((helpItem) => (
              <TouchableOpacity
                key={helpItem.title}
                onPress={() => onCkickHelp(helpObj, helpItem)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuRow,
                    { borderColor: isDark ? "#252527" : "#F0F3F7" },
                  ]}
                >
                  <ThemedText darkColor="#FBFCFF" lightColor="#1B1B1C">
                    {helpItem.title}
                  </ThemedText>
                  <ArrowIconRight />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );

  const renderAboutScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.aboutContainer}>
      <LogoIcon />
      <View style={styles.aboutInfo}>
        <ThemedText darkColor="#FBFCFF">
          Версия: {versionInfo.version} (build {versionInfo.build})
        </ThemedText>
        <ThemedText darkColor="#FBFCFF">
          Последнее обновление: {aboutInfo.lastUpdate}
        </ThemedText>
        <ThemedText darkColor="#FBFCFF">
          Размер кэша: {aboutInfo.cacheSize}
        </ThemedText>
      </View>
      <View style={styles.aboutLinks}>
        <TouchableOpacity
          onPress={() => openLegalDocument('license')}
          activeOpacity={0.7}
        >
          <ThemedText lightColor="#203686" darkColor="#4C94FF" style={styles.legalLink}>
            Лицензионное соглашение
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLegalDocument('userAgreement')}
          activeOpacity={0.7}
        >
          <ThemedText lightColor="#203686" darkColor="#4C94FF" style={styles.legalLink}>
            Пользовательское соглашение
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLegalDocument('privacy')}
          activeOpacity={0.7}
        >
          <ThemedText lightColor="#203686" darkColor="#4C94FF" style={styles.legalLink}>
            Политика конфиденциальности
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderLegalDocumentScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.contentContainer}>
      {legalDocumentId && (
        <LegalDocumentViewer
          documentId={legalDocumentId}
          operatorEmail={supportContacts.email}
        />
      )}
    </ThemedView>
  );

  const renderHelpContentScreen = () => (
    <ThemedView lightColor="#FFFFFF" darkColor="#151516" style={styles.contentContainer}>
      {currentHelpObject && (
        <HtmlContentViewer html={currentHelpObject.currentHtml} />
      )}
    </ThemedView>
  );

  const renderSupportModal = () => (
    <SnapBottomSheet
      visible={supportModalState === 'visible'}
      title="Поддержка"
      titleAlign="left"
      onClose={() => setSupportModalState('hidden')}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.supportContent,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <ThemedText>Выберите удобный способ связи</ThemedText>

        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactButton} onPress={handlePhonePress}>
            <ThemedView lightColor="#203686" darkColor="#3881EE" style={[styles.contactIcon]}>
              <SupportPhoneIcon fill="#FBFCFF" />
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} onPress={handleTelegramPress}>
            <ThemedView lightColor="#203686" darkColor="#3881EE" style={[styles.contactIcon]}>
              <SupportTelegramIcon fill="#FBFCFF" />
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
            <ThemedView lightColor="#203686" darkColor="#3881EE" style={[styles.contactIcon]}>
              <SupportEmailIcon fill="#FBFCFF" />
            </ThemedView>
          </TouchableOpacity>
        </View>

        <View style={styles.supportActionsRow}>
          <PrimaryButton
            title="Закрыть"
            variant="third"
            onPress={() => setSupportModalState('hidden')}
            style={styles.supportActionButton}
          />
          <PrimaryButton
            title="Перейти в FAQ"
            onPress={handleFaqPress}
            style={styles.supportActionButton}
          />
        </View>
      </ScrollView>
    </SnapBottomSheet>
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
      case 'legalDocument': return renderLegalDocumentScreen();
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
    marginTop: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
  },
  mainMenuCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  helpSection: {
    marginBottom: 24,
    gap: 4,
  },
  helpSectionTitle: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  helpListCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
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
  legalLink: {
    fontSize: 15,
    fontWeight: "500",
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
  supportContent: {
    gap: 24,
  },
  contactRow: {
    flexDirection: "row",
    gap: 8,
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
  supportActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  supportActionButton: {
    flex: 1,
  },
});