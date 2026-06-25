// features/home/components/CompanySelectModal.tsx
import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { compliteCompany, getMyInfo, getMyParams } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { baseUrl } from "@/features/shared/services/axios";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedTextInput from "./components/CustomInput";
import { DatePickerWithIcon } from "./components/DatePickerCustom";
import { PrimaryButton } from "./components/PrimartyButton";

interface CompanySelectModalProps {
  visible: boolean;
  onClose: () => void;
  companies: any[];
  selectedCompanyId?: string;
  onSelectCompany: (company: any) => void;
  onAddCompany: () => void;
  screenScene?: any;
  /** Без отдельного Modal — для вложения в другой экран (iOS). */
  embedded?: boolean;
}
export enum CompanyScenario {
  DEFAULT = "choose",
  REG = "register",
}
const CreditProgressBar: React.FC<{ usedCredit: number; creditLimit: number }> = ({ 
  usedCredit, 
  creditLimit 
}) => {
  const percentage = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;
  
  const progressColor = percentage < 50 ? "#6FBD15" : "#FF8605";
  
  const displayPercentage = Math.min(percentage, 100);
  
  return (
    <View style={styles.progressBarContainer}>
      <View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${displayPercentage}%`,
            backgroundColor: progressColor 
          }
        ]} 
      />
    </View>
  );
};

export const CompanySelectModal: React.FC<CompanySelectModalProps> = ({
  visible,
  onClose,
  companies,
  selectedCompanyId,
  onSelectCompany,
  onAddCompany,
  screenScene = "choose",
  embedded = false,
}) => {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";
  const [orgName, setOrgName] = useState("");
  const [kpp, setKpp] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [dateCreated, setDateCreated] = useState("");
  const [inn, setInn] = useState("");

  const loading = useAppSelector((state) => state.auth.isLoading);
  const storeCompanies = useAppSelector((state) => state.auth.me?.companies);
  const displayCompanies = storeCompanies?.length ? storeCompanies : companies;

  const [currentScreen, setCurrentScreen] =
    useState<CompanyScenario>(screenScene);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!visible || currentScreen !== CompanyScenario.DEFAULT) {
      return;
    }

    setIsLoadingCompanies(true);
    dispatch(getMyInfo("")).finally(() => {
      setIsLoadingCompanies(false);
    });
  }, [visible, currentScreen, dispatch]);

  const handleAcceptCompany = () => {
    dispatch(
      compliteCompany({
        name: orgName,
        inn: inn,
        foundationDate: dateCreated,
        kpp: kpp,
        legalAddress: legalAddress,
        contactPerson: contactPerson,
      }),
    ).then((res) => {
      if (compliteCompany.fulfilled.match(res)) {
        dispatch(getMyInfo("")).then((res) => {
          if (getMyInfo.fulfilled.match(res)) {
            dispatch(getMyParams(""))
            setCurrentScreen(CompanyScenario.DEFAULT);
          }
        });
      }
    });
  };
  //  const companies = [
  //     {
  //         "id": "019c6b5e-3f0f-7638-a9a0-e62be29189fc",
  //         "name": "ООО test",
  //         "inn": "9999999999",
  //         "foundationDate": "01/17/2002",
  //         "kpp": "123456789",
  //         "legalAddress": "test",
  //         "contactPerson": "test",
  //         "deliveryAddresses": []
  //     },
  //     {
  //         "id": "019c6b5e-3f0f-7638-a9a0-e62be29189fc",
  //         "name": "ООО test",
  //         "inn": "9999999999",
  //         "foundationDate": "01/17/2002",
  //         "kpp": "123456789",
  //         "legalAddress": "test",
  //         "contactPerson": "test",
  //         "deliveryAddresses": []
  //     },
  //     {
  //         "id": "019c6b5e-3f0f-7638-a9a0-e62be29189fc",
  //         "name": "ООО test",
  //         "inn": "9999999999",
  //         "foundationDate": "01/17/2002",
  //         "kpp": "123456789",
  //         "legalAddress": "test",
  //         "contactPerson": "test",
  //         "deliveryAddresses": []
  //     },
  //     {
  //         "id": "019c6b5e-3f0f-7638-a9a0-e62be29189fc",
  //         "name": "ООО test",
  //         "inn": "9999999999",
  //         "foundationDate": "01/17/2002",
  //         "kpp": "123456789",
  //         "legalAddress": "test",
  //         "contactPerson": "test",
  //         "deliveryAddresses": []
  //     },
  //     {
  //         "id": "019c6b5e-3f0f-7638-a9a0-e62be29189fc",
  //         "name": "ООО test",
  //         "inn": "9999999999",
  //         "foundationDate": "01/17/2002",
  //         "kpp": "123456789",
  //         "legalAddress": "test",
  //         "contactPerson": "test",
  //         "deliveryAddresses": []
  //     },
  //     {
  //         "id": "019c6b5e-3f0f-7638-a9a0-e62be29189fc",
  //         "name": "ООО test",
  //         "inn": "9999999999",
  //         "foundationDate": "01/17/2002",
  //         "kpp": "123456789",
  //         "legalAddress": "test",
  //         "contactPerson": "test",
  //         "deliveryAddresses": []
  //     }
  //  ]
  if (!visible) {
    return null;
  }

  const body = (
    <>
      {currentScreen === "choose" ? (
        <ThemedView
          lightColor="#EBEDF0"
          darkColor="#040508"
          style={styles.modalContainer}
        >
          {/* Хедер модалки */}
          <ModalHeader
            title="Аккаунты"
            showBackButton={true}
            onBackPress={() => {
              onClose();
            }}
          />

          {/* Контент */}
          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.content}
          >
            <ThemedText style={styles.contentTitle}>
              Выберите аккаунт
            </ThemedText>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                isLoadingCompanies && styles.scrollContentLoading,
              ]}
            >
              {isLoadingCompanies ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator
                    size="large"
                    color={isDark ? "#FBFCFF" : "#203686"}
                  />
                </View>
              ) : (
              displayCompanies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyCard}
                  onPress={() => {
                    onSelectCompany(company);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedView
                    lightColor="#F2F4F7"
                    darkColor="#202022"
                    style={styles.companyCardInner}
                  >
                    <View style={styles.companyInfo}>
                      <View style={styles.companyInnRow}>
                        <ThemedText
                          style={styles.companyName}
                          lightColor="#1B1B1C"
                          darkColor="#FBFCFF"
                          numberOfLines={1}
                        >
                          {company.name}
                        </ThemedText>
                        <ArrowIconRight color={isDarkMode ? "#FBFCFF" : "#1B1B1C"}/>
                      </View>

                      <View style={styles.companyInnRow}>
                        <ThemedText
                          style={styles.companyInn}
                          lightColor="#80818B"
                          darkColor="#FBFCFF80"
                        >
                          ИНН {company.inn || "-"}
                        </ThemedText>
                      </View>

                      {company.manager?.name ? (
                        <View style={styles.managerRow}>
                          {company.manager.image ? (
                            <Image
                              source={{ uri: `${baseUrl}/${company.manager.image}` }}
                              style={styles.managerAvatar}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.managerAvatar, styles.managerAvatarPlaceholder]}>
                              <ThemedText
                                style={styles.managerAvatarLetter}
                                lightColor="#80818B"
                                darkColor="#FBFCFF80"
                              >
                                {company.manager.name.charAt(0)}
                              </ThemedText>
                            </View>
                          )}
                          <View style={styles.managerTextWrap}>
                            <ThemedText
                              style={styles.managerName}
                              lightColor="#1B1B1C"
                              darkColor="#FBFCFF"
                              numberOfLines={1}
                            >
                              {company.manager.name}
                            </ThemedText>
                            <ThemedText
                              style={styles.managerRole}
                              lightColor="#80818B"
                              darkColor="#FBFCFF80"
                            >
                              Менеджер
                            </ThemedText>
                          </View>
                        </View>
                      ) : null}

                      <View style={styles.companyLimit}>
                        <ThemedText
                          style={styles.companyLimitTitle}
                        >
                          Лимит организации
                        </ThemedText>

                        <CreditProgressBar 
                          usedCredit={company?.usedCredit || 0} 
                          creditLimit={company?.creditLimit || 0} 
                        />
                        <View style={styles.companyInnRow}>
                        <View style={styles.companyLimitRow}>
                        <ThemedText
                          style={styles.companyInn}
                        >
                          Использовано {company?.usedCredit || "-"} ₽ / {' '}
                        </ThemedText>
                        <ThemedText 
                          style={styles.companyInn}
                          lightColor="#80818B"
                          darkColor="#FBFCFF80"
                          >
                         {company?.creditLimit || "-"} ₽
                        </ThemedText>
                        </View>
                        <ThemedText
                         style={styles.companyPersent}
                         lightColor="#80818B"
                         darkColor="#FBFCFF80">
                          {
                            company?.creditLimit > 0 ? Math.round((company?.usedCredit / company?.creditLimit) * 100) : 0 
                          }%
                        </ThemedText>
                        </View>
                      </View>
                    </View>
                  </ThemedView>
                </TouchableOpacity>
              ))
              )}
            </ScrollView>
          </ThemedView>

          {/* Кнопка добавления компании - следует за скроллом */}
          <View
            style={[
              styles.footer,
              { paddingBottom: 16 + insets.bottom },
            ]}
          >
            <PrimaryButton
              title="+ Добавить аккаунт"
              onPress={() => {
                //   onAddCompany();
                setCurrentScreen(CompanyScenario.REG);

                //   onClose();
              }}
              variant="primary"
              size="md"
              fullWidth
              disabled={displayCompanies.some((item) => item.type === "individual")}
            />
          </View>
        </ThemedView>
      ) : (
        <ThemedView
          lightColor={"#EBEDF0"}
          darkColor="#040508"
          style={styles.modalContainer}
        >
          <ModalHeader
            title="Добавление аккаунта"
            showBackButton={true}
            onBackPress={() => {
              if (screenScene === "register") {
                onClose();
              } else {
                setCurrentScreen(CompanyScenario.DEFAULT);
              }
            }}
          />
          <ThemedView
            style={styles.modalContentInnerRegUser}
            lightColor={"#FFFFFF"}
            darkColor="#151516"
          >
            <View>
              <ThemedText weight={'semiBold'} style={styles.accountTypeTitle}>
                Введите данные компании
              </ThemedText>
              {/* const [orgName, setOrgName] = useState('')
const [kpp, setKpp] = useState('')
const [legalAddress, setLegalAddress] = useState('')
const [contactPerson, setContactPerson] = useState('') */}
              <View style={styles.regCompanyBlock}>
                <AnimatedTextInput
                  placeholder="Полное наименование организации"
                  placeholderTextColor="#80818B"
                  value={orgName}
                  onChangeText={setOrgName}
                />
                <AnimatedTextInput
                  placeholder="ИНН"
                  placeholderTextColor="#80818B"
                  value={inn}
                  onChangeText={setInn}
                  maxLength={10}
                  // keyboardType="phone-pad"
                />
                <AnimatedTextInput
                  placeholder="КПП"
                  placeholderTextColor="#80818B"
                  value={kpp}
                  onChangeText={setKpp}
                />
                <AnimatedTextInput
                  placeholder="Юридический адрес"
                  placeholderTextColor="#80818B"
                  value={legalAddress}
                  onChangeText={setLegalAddress}
                />
                <AnimatedTextInput
                  placeholder="ФИО контактного лица"
                  placeholderTextColor="#80818B"
                  value={contactPerson}
                  onChangeText={setContactPerson}
                />
                <DatePickerWithIcon
                  placeholder="Дата образования вашей компании"
                  placeholderTextColor="#80818B"
                  value={dateCreated}
                  onChangeText={setDateCreated}
                />
              </View>
            </View>
          </ThemedView>
          <View
            style={[
              styles.footerNew,
              { paddingBottom: 16 + insets.bottom },
            ]}
          >
            <PrimaryButton
              title="Завершить регистрацию"
              onPress={() => handleAcceptCompany()}
              variant="primary"
              size="md"
              loading={loading}
              activeOpacity={0.8}
              fullWidth
              disabled={
                !orgName ||
                !inn ||
                !kpp ||
                !legalAddress ||
                !contactPerson ||
                !dateCreated ||
                loading
              }
            />
          </View>
        </ThemedView>
      )}
    </>
  );

  if (embedded) {
    return <View style={styles.modalContainer}>{body}</View>;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {body}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 36,
  },
  content: {
    marginTop: 16,
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: "20%",
  },
  scrollContentLoading: {
    flexGrow: 1,
    justifyContent: "center",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  companyCard: {
    marginBottom: 12,
  },
  companyCardInner: {
    borderRadius: 16,
    padding: 16,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  companyInnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyInn: {
    fontSize: 14,
    fontWeight: "500",
  },
  managerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  managerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  managerAvatarPlaceholder: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  managerAvatarLetter: {
    fontSize: 16,
    fontWeight: "600",
  },
  managerTextWrap: {
    flex: 1,
    gap: 2,
  },
  managerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  managerRole: {
    fontSize: 12,
    fontWeight: "500",
  },
  companyLimit: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  companyLimitRow: {
    flexDirection: "row",
    alignItems: "center",

  },
  companyLimitTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  companyPersent: {
    fontSize: 12,
    fontWeight: "500",

  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 16,
  },
  footerNew: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 34,
    // paddingTop: 16,
  },

  modalContentInnerRegUser: {
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    height: "90%",
    justifyContent: "space-between",
  },
  accountTypeTitle: {
    fontSize: 20,
    fontWeight: 600,
    // marginBottom: 16,
  },
  regCompanyBlock: {
    marginTop: 24,
    gap: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E9EDF1",
    borderRadius: 2,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});
