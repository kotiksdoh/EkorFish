type AppToastType = "success" | "error" | "info" | "warn";

export type AppToastState = {
  id: number;
  type: AppToastType;
  text1: string;
  text2?: string;
};

type ShowAppToastOptions = {
  type?: AppToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
};

type AppToastListener = (toast: AppToastState | null) => void;
type AppModalLayerListener = () => void;

const listeners = new Set<AppToastListener>();
const modalLayerListeners = new Set<AppModalLayerListener>();

let toastId = 0;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let currentToast: AppToastState | null = null;
const modalLayerStack: symbol[] = [];

function emit(toast: AppToastState | null) {
  currentToast = toast;
  listeners.forEach((listener) => listener(toast));
}

function emitModalLayersChanged() {
  modalLayerListeners.forEach((listener) => listener());
}

export function getCurrentToast() {
  return currentToast;
}

export function getAppModalLayerCount() {
  return modalLayerStack.length;
}

export function subscribeAppToast(listener: AppToastListener) {
  listeners.add(listener);
  listener(currentToast);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeAppModalLayers(listener: AppModalLayerListener) {
  modalLayerListeners.add(listener);
  return () => {
    modalLayerListeners.delete(listener);
  };
}

export function registerAppModalLayer(layerId: symbol) {
  modalLayerStack.push(layerId);
  emitModalLayersChanged();
  return () => {
    const index = modalLayerStack.lastIndexOf(layerId);
    if (index >= 0) {
      modalLayerStack.splice(index, 1);
    }
    emitModalLayersChanged();
  };
}

export function isTopmostAppModalLayer(layerId: symbol) {
  return modalLayerStack[modalLayerStack.length - 1] === layerId;
}

export function dismissAppToast() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  emit(null);
}

export function showAppToast({
  type = "error",
  text1,
  text2,
  visibilityTime = 4500,
}: ShowAppToastOptions) {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  const nextToast: AppToastState = {
    id: ++toastId,
    type,
    text1,
    text2,
  };

  emit(nextToast);

  hideTimer = setTimeout(() => {
    hideTimer = null;
    if (currentToast?.id === nextToast.id) {
      emit(null);
    }
  }, visibilityTime);
}
