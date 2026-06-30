import { AppToastPortal } from "@/features/shared/ui/AppToastPortal";
import {
  isTopmostAppModalLayer,
  registerAppModalLayer,
  subscribeAppModalLayers,
} from "@/features/shared/services/appToast";
import React, { useEffect, useRef, useState } from "react";
import { Modal, type ModalProps } from "react-native";

export function AppModal({ children, visible = false, ...rest }: ModalProps) {
  const layerId = useRef(Symbol("app-modal-layer")).current;
  const [isTopLayer, setIsTopLayer] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsTopLayer(false);
      return;
    }

    const unregister = registerAppModalLayer(layerId);
    const syncTopLayer = () => {
      setIsTopLayer(isTopmostAppModalLayer(layerId));
    };

    syncTopLayer();
    const unsubscribe = subscribeAppModalLayers(syncTopLayer);

    return () => {
      unsubscribe();
      unregister();
    };
  }, [layerId, visible]);

  return (
    <Modal visible={visible} {...rest}>
      {children}
      {visible && isTopLayer ? <AppToastPortal /> : null}
    </Modal>
  );
}
