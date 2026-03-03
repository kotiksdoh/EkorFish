// features/home/components/HomeHeader.tsx
import { LemonIcon, PersonCircleIcon } from "@/assets/icons/icons.js";
import { ThemedText } from "@/components/themed-text";
import {
  loadCompanyFromStorage,
  selectCompany,
  setCompany,
} from "@/features/auth/authSlice";
import { CompanySelectModal } from "@/features/shared/ui/CompanySelectModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { BonusPage } from "../screens/BonusScreen";

interface HomeHeaderProps {
  title?: string;
  transparent?: boolean;
  onLoginPress?: () => void;
  onAddCompanyPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  title = "EkorFish",
  transparent = true,
  onLoginPress,
  onAddCompanyPress,
}) => {
  const me = useAppSelector((state) => state.auth.me);
  const [modalVisible, setModalVisible] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const codeBackgroundColor = currentTheme === "dark" ? "#202022" : "#F2F4F7";
  const [displayName, setDisplayName] = useState("");
  const dispatch = useAppDispatch();
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  useEffect(() => {
    console.log("me", me);
  }, me);
  useEffect(() => {
    if (me) {
      dispatch(loadCompanyFromStorage());
    }
  }, [me]);

  const handleSelectCompany = async (company: any) => {
    console.log("Selected company:", company);
    // Используем Redux action для сохранения компании
    dispatch(setCompany(company));
    setModalVisible(false);
  };

  const getDisplayName = () => {
    if (!me) return "";
    debugger;
    if (me.companies?.length > 0) {
      return currentCompany?.name || me.companies[0]?.name || "";
    }
    debugger;
    const profile = me.individualProfile;
    if (profile) {
      return `${profile.firstName || ""} ${profile.lastName || ""} ${profile.patronymic || ""}`.trim();
    }

    return "";
  };

  return (
    <>
      <View style={[styles.header, transparent && styles.headerTransparent]}>
        {me === null ? (
          <View style={styles.headerContent}>
            <View></View>
            <TouchableOpacity
              style={[
                { backgroundColor: codeBackgroundColor },
                styles.loginButton,
              ]}
              onPress={onLoginPress}
              activeOpacity={0.7}
            >
              <ThemedText
                darkColor="#FBFCFF"
                lightColor="#1B1B1C"
                style={styles.loginButtonText}
              >
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
              <PersonCircleIcon />
              <ThemedText
                lightColor="#FBFCFF"
                darkColor="#FBFCFF"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ maxWidth: 150 }}
              >
                {getDisplayName()}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headInfo}
              onPress={() => setBonusModalVisible(true)}
              activeOpacity={0.7}
            >
            <View style={styles.headInfoBonus}>
              <LemonIcon />
              <ThemedText lightColor="#FBFCFF" darkColor="#FBFCFF">
                0
              </ThemedText>
            </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CompanySelectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        companies={me?.companies || []}
        selectedCompanyId={me?.companies[0]?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={
          onAddCompanyPress ||
          (() => {
            // Здесь можно открыть модалку регистрации компании
            console.log("Add company pressed");
          })
        }
      />
      <BonusPage
        visible={bonusModalVisible}
        onClose={() => setBonusModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  headerTransparent: {
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(32, 54, 134, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  headInfo: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  headInfoBonus: {
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
});
