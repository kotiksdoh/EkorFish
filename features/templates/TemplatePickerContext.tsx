import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  addOrderPresetItem,
  fetchOrderPresetDetails,
} from "@/features/templates/orderPresetsSlice";
import { useAppDispatch } from "@/store/hooks";
import type { TemplateLineItem } from "./types";

type TemplatePickerContextValue = {
  pickingForTemplateId: string | null;
  liveTemplateItems: TemplateLineItem[];
  openSearchAfterNavigate: boolean;
  resumeDetailTemplateId: string | null;
  startPickingCatalog: (templateId: string) => Promise<void>;
  startPickingSearch: (templateId: string) => Promise<void>;
  consumeOpenSearchFlag: () => void;
  addLineFromProduct: (line: TemplateLineItem) => Promise<void>;
  returnToTemplateEditor: () => void;
  clearResumeDetail: () => void;
  getExistingTemplateLinesForProduct: (productId: string) => any[];
};

const TemplatePickerContext = createContext<TemplatePickerContextValue | null>(
  null,
);

function adaptPresetItemsToLines(items: any[]): TemplateLineItem[] {
  return (items || []).map((it) => {
    const step =
      typeof it.purchaseOptionStep === "number" && it.purchaseOptionStep > 0
        ? it.purchaseOptionStep
        : 1;
    return {
      productId: String(it.productId),
      productPurchaseOptionId: String(it.productPurchaseOptionId),
      quantity: typeof it.quantity === "number" ? it.quantity : 0,
      productName: it.productName ?? "",
      productImage: typeof it.productImage === "string" ? it.productImage : undefined,
      measureType: it.measureType,
      pricePerUnit: typeof it.price === "number" ? it.price : 0,
      step,
      minQuantity: step,
      isFavorite: !!it.isFavorite,
    } as TemplateLineItem;
  });
}

export function TemplatePickerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [pickingForTemplateId, setPickingForTemplateId] = useState<
    string | null
  >(null);
  const [liveTemplateItems, setLiveTemplateItems] = useState<
    TemplateLineItem[]
  >([]);
  const [openSearchAfterNavigate, setOpenSearchAfterNavigate] = useState(false);
  const [resumeDetailTemplateId, setResumeDetailTemplateId] = useState<
    string | null
  >(null);

  const startPickingCatalog = useCallback(async (templateId: string) => {
    try {
      const details = await dispatch(fetchOrderPresetDetails(templateId)).unwrap();
      setLiveTemplateItems(adaptPresetItemsToLines((details as any)?.items || []));
    } catch {
      setLiveTemplateItems([]);
    }
    setPickingForTemplateId(templateId);
    setOpenSearchAfterNavigate(false);
    router.navigate("/dashboard");
  }, [router, dispatch]);

  const startPickingSearch = useCallback(async (templateId: string) => {
    try {
      const details = await dispatch(fetchOrderPresetDetails(templateId)).unwrap();
      setLiveTemplateItems(adaptPresetItemsToLines((details as any)?.items || []));
    } catch {
      setLiveTemplateItems([]);
    }
    setPickingForTemplateId(templateId);
    setOpenSearchAfterNavigate(true);
    router.navigate("/dashboard");
  }, [router, dispatch]);

  const consumeOpenSearchFlag = useCallback(() => {
    setOpenSearchAfterNavigate(false);
  }, []);

  const addLineFromProduct = useCallback(async (line: TemplateLineItem) => {
    if (!pickingForTemplateId) return;
    try {
      await dispatch(
        addOrderPresetItem({
          presetId: pickingForTemplateId,
          productId: line.productId,
          productPurchaseOptionId: line.productPurchaseOptionId,
          quantity: line.quantity,
        }),
      ).unwrap();
      const details = await dispatch(
        fetchOrderPresetDetails(pickingForTemplateId),
      ).unwrap();
      setLiveTemplateItems(adaptPresetItemsToLines((details as any)?.items || []));
    } catch {
      // ignore
    }
  }, [pickingForTemplateId]);

  const returnToTemplateEditor = useCallback(() => {
    const id = pickingForTemplateId;
    setPickingForTemplateId(null);
    setLiveTemplateItems([]);
    setOpenSearchAfterNavigate(false);
    if (id) {
      setResumeDetailTemplateId(id);
    }
    router.navigate("/user");
  }, [pickingForTemplateId, router]);

  const clearResumeDetail = useCallback(() => {
    setResumeDetailTemplateId(null);
  }, []);

  const getExistingTemplateLinesForProduct = useCallback(
    (productId: string) => {
      return liveTemplateItems.filter(
        (i) => String(i.productId) === String(productId),
      );
    },
    [liveTemplateItems],
  );

  const value = useMemo(
    () => ({
      pickingForTemplateId,
      liveTemplateItems,
      openSearchAfterNavigate,
      resumeDetailTemplateId,
      startPickingCatalog,
      startPickingSearch,
      consumeOpenSearchFlag,
      addLineFromProduct,
      returnToTemplateEditor,
      clearResumeDetail,
      getExistingTemplateLinesForProduct,
    }),
    [
      pickingForTemplateId,
      liveTemplateItems,
      openSearchAfterNavigate,
      resumeDetailTemplateId,
      startPickingCatalog,
      startPickingSearch,
      consumeOpenSearchFlag,
      addLineFromProduct,
      returnToTemplateEditor,
      clearResumeDetail,
      getExistingTemplateLinesForProduct,
    ],
  );

  return (
    <TemplatePickerContext.Provider value={value}>
      {children}
    </TemplatePickerContext.Provider>
  );
}

export function useTemplatePicker(): TemplatePickerContextValue {
  const ctx = useContext(TemplatePickerContext);
  if (!ctx) {
    return {
      pickingForTemplateId: null,
      liveTemplateItems: [],
      openSearchAfterNavigate: false,
      resumeDetailTemplateId: null,
      startPickingCatalog: async () => {},
      startPickingSearch: async () => {},
      consumeOpenSearchFlag: () => {},
      addLineFromProduct: async () => {},
      returnToTemplateEditor: () => {},
      clearResumeDetail: () => {},
      getExistingTemplateLinesForProduct: () => [],
    };
  }
  return ctx;
}
