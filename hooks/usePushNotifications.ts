import { axdef } from "@/features/shared/services/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DEVICE_ID_STORAGE_KEY = "device_id";

async function getOrCreateDeviceId(): Promise<string> {
  const existingDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const generatedDeviceId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, generatedDeviceId);
  return generatedDeviceId;
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications work only on a physical device.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission was not granted.');
    return null;
  }

  try {
    // Firebase messaging needs native remote messages registration on iOS.
    await messaging().registerDeviceForRemoteMessages();
    const firebaseToken = await messaging().getToken();

    if (firebaseToken && typeof firebaseToken === "string") {
      return firebaseToken;
    }

    console.log(`${Platform.OS} Firebase token is empty or invalid.`);
    return null;
  } catch (error) {
    console.log(`${Platform.OS} Firebase token fetch failed:`, error);
    return null;
  }
}

async function sendFirebaseTokenToBackend(tokenFirebase: string): Promise<void> {
  const authToken = await AsyncStorage.getItem("token");

  if (!authToken) {
    console.log("Skip firebase-token request: user is not authenticated.");
    return;
  }

  const deviceId = await getOrCreateDeviceId();

  await axdef.post("/api/Account/firebase-token", {
    deviceId,
    tokenFirebase,
  });
}

export async function syncPushTokenToBackend(
  source: "app_start" | "post_login" = "app_start",
): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync();

    if (!pushToken) {
      console.log(`[Push][${source}] No native push token received.`);
      return;
    }

    console.log(`[Push][${source}] Push token to backend:`, pushToken);
    await sendFirebaseTokenToBackend(pushToken);
    console.log(`[Push][${source}] Firebase token sent to backend.`);
  } catch (error) {
    console.log(`[Push][${source}] Token sync failed:`, error);
  }
}

export function usePushNotifications() {
  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    void (async () => {
      await syncPushTokenToBackend("app_start");
    })();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Foreground notification:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification click response:", response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }

      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
}
