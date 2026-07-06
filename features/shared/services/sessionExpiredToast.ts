import { showAppToast } from "./appToast";

export const SESSION_EXPIRED_MESSAGE = "Ваша сессия истекла, авторизуйтесь";

let sessionExpiredToastShown = false;

export const showSessionExpiredToast = () => {
  if (sessionExpiredToastShown) return;
  sessionExpiredToastShown = true;
  showAppToast({
    type: "error",
    text1: SESSION_EXPIRED_MESSAGE,
  });
  setTimeout(() => {
    sessionExpiredToastShown = false;
  }, 3000);
};
