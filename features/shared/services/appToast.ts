import { Toast } from "toastify-react-native";

type AppToastType = "success" | "error" | "info" | "warn";

type ShowAppToastOptions = {
  type?: AppToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
};

export function showAppToast({
  type = "error",
  text1,
  text2,
  visibilityTime = 4500,
}: ShowAppToastOptions) {
  Toast.show({
    type,
    text1,
    text2,
    position: "top",
    useModal: false,
    visibilityTime,
  });
}
