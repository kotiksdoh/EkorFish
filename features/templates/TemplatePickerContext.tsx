import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  addOrMergeTemplateLine,
  getTemplateById,
} from "./templateStorage";
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

export function TemplatePickerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
    const t = await getTemplateById(templateId);
    setLiveTemplateItems(t?.items ? [...t.items] : []);
    setPickingForTemplateId(templateId);
    setOpenSearchAfterNavigate(false);
    router.navigate("/dashboard");
  }, [router]);

  const startPickingSearch = useCallback(async (templateId: string) => {
    const t = await getTemplateById(templateId);
    setLiveTemplateItems(t?.items ? [...t.items] : []);
    setPickingForTemplateId(templateId);
    setOpenSearchAfterNavigate(true);
    router.navigate("/dashboard");
  }, [router]);

  const consumeOpenSearchFlag = useCallback(() => {
    setOpenSearchAfterNavigate(false);
  }, []);

  const addLineFromProduct = useCallback(async (line: TemplateLineItem) => {
    if (!pickingForTemplateId) return;
    const updated = await addOrMergeTemplateLine(pickingForTemplateId, line);
    if (updated) {
      setLiveTemplateItems(updated.items);
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
