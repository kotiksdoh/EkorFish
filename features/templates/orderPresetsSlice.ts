import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosErrorHandler } from "@/features/shared/services/api";
import { axdef } from "@/features/shared/services/axios";
import type { PresetOwnerPayload } from "@/features/shared/utils/presetOwnerPayload";

export interface OrderPresetListItem {
  id: string;
  name: string;
  description?: string;
  reminderFrequency?: number;
  companyId?: string | null;
  individualProfileId?: string | null;
  companyName?: string | null;
  userLoginId?: string | null;
  isPrivateToLogin?: boolean;
  totalProductsPrice: number;
  productsCount: number;
  createdAt: string;
}

export interface OrderPresetItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPurchaseOptionId: string;
  purchaseOptionStep: number;
  price: number;
  quantity: number;
  totalPrice: number;
  measureType: string;
  isFavorite: boolean;
  stockInfo?: string;
  stockQuantity: number;
}

export interface OrderPresetDetails extends OrderPresetListItem {
  items: OrderPresetItem[];
  totalWeightKg: number;
}

export interface OrderPresetPageData {
  reminderFrequencies: Array<{ frequency: number; name: string }>;
}

type CreateOrderPresetPayload = {
  name: string;
  description: string;
  reminderFrequency: number;
  isPrivateToLogin?: boolean;
} & PresetOwnerPayload;

export const fetchOrderPresets = createAsyncThunk(
  "orderPresets/fetchList",
  async (filter: PresetOwnerPayload | void, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { orderPresets: OrderPresetsState };
      const ownerFilter = filter ?? state.orderPresets.listOwnerFilter ?? {};
      const params: Record<string, string> = {};

      if (ownerFilter.companyId) {
        params.companyId = ownerFilter.companyId;
      } else if (ownerFilter.individualProfileId) {
        params.individualProfileId = ownerFilter.individualProfileId;
      }

      const response = await axdef.get("/api/OrderPreset", { params });
      return (response.data.data || []) as OrderPresetListItem[];
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const fetchOrderPresetPageData = createAsyncThunk(
  "orderPresets/fetchPageData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axdef.get("/api/OrderPreset/page-data");
      return response.data.data as OrderPresetPageData;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const fetchOrderPresetDetails = createAsyncThunk(
  "orderPresets/fetchDetails",
  async (presetId: string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(`/api/OrderPreset/${presetId}/details`);
      return response.data.data as OrderPresetDetails;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const createOrderPreset = createAsyncThunk(
  "orderPresets/create",
  async (payload: CreateOrderPresetPayload, { rejectWithValue, dispatch }) => {
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        description: payload.description,
        reminderFrequency: payload.reminderFrequency,
      };

      if (payload.companyId) {
        body.companyId = payload.companyId;
      }
      if (payload.individualProfileId) {
        body.individualProfileId = payload.individualProfileId;
      }
      if (
        payload.companyId &&
        typeof payload.isPrivateToLogin === "boolean"
      ) {
        body.isPrivateToLogin = payload.isPrivateToLogin;
      }

      const response = await axdef.post("/api/OrderPreset", body);
      await dispatch(fetchOrderPresets());
      return response.data.data as { id: string } | OrderPresetListItem;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const updateOrderPreset = createAsyncThunk(
  "orderPresets/update",
  async (
    payload: {
      presetId: string;
      name: string;
      description: string;
      reminderFrequency: number;
      companyId?: string;
      isPrivateToLogin?: boolean;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        description: payload.description,
        reminderFrequency: payload.reminderFrequency,
      };

      if (payload.companyId) {
        body.companyId = payload.companyId;
      }
      if (typeof payload.isPrivateToLogin === "boolean") {
        body.isPrivateToLogin = payload.isPrivateToLogin;
      }

      const response = await axdef.put(`/api/OrderPreset/${payload.presetId}`, body);
      await dispatch(fetchOrderPresets());
      await dispatch(fetchOrderPresetDetails(payload.presetId));
      return response.data.data as {
        name: string;
        description: string;
        reminderFrequency: number;
      };
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const fillCartFromPreset = createAsyncThunk(
  "orderPresets/fillCart",
  async (presetId: string, { rejectWithValue }) => {
    try {
      const response = await axdef.post(`/api/OrderPreset/${presetId}/fill-cart`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const addOrderPresetItem = createAsyncThunk(
  "orderPresets/addItem",
  async (
    payload: {
      presetId: string;
      productId: string;
      productPurchaseOptionId: string;
      quantity: number;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axdef.post(
        `/api/OrderPreset/${payload.presetId}/items`,
        {
          productId: payload.productId,
          productPurchaseOptionId: payload.productPurchaseOptionId,
          quantity: payload.quantity,
        },
      );
      // Важно: не рефетчим детали здесь, чтобы не было двойных запросов и гонок.
      // Экран/контекст сам решает, когда обновлять details.
      return response.data.data as OrderPresetItem;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const updateOrderPresetItemQuantity = createAsyncThunk(
  "orderPresets/updateItemQuantity",
  async (
    payload: { presetId: string; itemId: string; quantity: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axdef.put(
        `/api/OrderPreset/${payload.presetId}/items/${payload.itemId}`,
        { quantity: payload.quantity },
      );
      await dispatch(fetchOrderPresetDetails(payload.presetId));
      return response.data.data as OrderPresetItem;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const deleteOrderPresetItem = createAsyncThunk(
  "orderPresets/deleteItem",
  async (
    payload: { presetId: string; itemId: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await axdef.delete(
        `/api/OrderPreset/${payload.presetId}/items/${payload.itemId}`,
      );
      await dispatch(fetchOrderPresetDetails(payload.presetId));
      return payload;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

export const deleteOrderPresetItemsBulk = createAsyncThunk(
  "orderPresets/deleteItemsBulk",
  async (
    payload: { presetId: string; itemIds: string[] },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const params = new URLSearchParams();
      payload.itemIds.forEach((id) => params.append("presetItemIds", id));
      await axdef.delete(`/api/OrderPreset/${payload.presetId}/items?${params.toString()}`);
      await dispatch(fetchOrderPresetDetails(payload.presetId));
      return payload;
    } catch (error: any) {
      if (error.response?.status !== 401) return rejectWithValue(error);
      throw error;
    }
  },
);

interface OrderPresetsState {
  list: OrderPresetListItem[];
  listOwnerFilter: PresetOwnerPayload;
  isLoadingList: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isFillingCart: boolean;
  isDeletingBulk: boolean;
  isLoadingDetails: boolean;
  isLoadingPageData: boolean;
  pageData: OrderPresetPageData | null;
  details: Record<string, OrderPresetDetails | undefined>;
  activePresetId: string | null;
}

const initialState: OrderPresetsState = {
  list: [],
  listOwnerFilter: {},
  isLoadingList: false,
  isCreating: false,
  isUpdating: false,
  isFillingCart: false,
  isDeletingBulk: false,
  isLoadingDetails: false,
  isLoadingPageData: false,
  pageData: null,
  details: {},
  activePresetId: null,
};

const orderPresetsSlice = createSlice({
  name: "orderPresets",
  initialState,
  reducers: {
    setActivePresetId: (state, action) => {
      state.activePresetId = action.payload;
    },
    clearActivePreset: (state) => {
      state.activePresetId = null;
    },
    clearPresetDetails: (state, action) => {
      const presetId: string | undefined = action.payload;
      if (!presetId) {
        state.details = {};
        return;
      }
      delete state.details[presetId];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOrderPresets.pending, (state, action) => {
      state.isLoadingList = true;
      if (action.meta.arg) {
        state.listOwnerFilter = action.meta.arg;
      }
    });
    builder.addCase(fetchOrderPresets.fulfilled, (state, action) => {
      state.list = action.payload || [];
      state.isLoadingList = false;
    });
    builder.addCase(fetchOrderPresets.rejected, (state, action) => {
      state.isLoadingList = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(fetchOrderPresetPageData.pending, (state) => {
      state.isLoadingPageData = true;
    });
    builder.addCase(fetchOrderPresetPageData.fulfilled, (state, action) => {
      state.pageData = action.payload || null;
      state.isLoadingPageData = false;
    });
    builder.addCase(fetchOrderPresetPageData.rejected, (state, action) => {
      state.isLoadingPageData = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(fetchOrderPresetDetails.pending, (state, action) => {
      state.isLoadingDetails = true;
      state.activePresetId = action.meta.arg;
    });
    builder.addCase(fetchOrderPresetDetails.fulfilled, (state, action) => {
      const d = action.payload;
      state.details[d.id] = d;
      state.activePresetId = d.id;
      state.isLoadingDetails = false;
    });
    builder.addCase(fetchOrderPresetDetails.rejected, (state, action) => {
      state.isLoadingDetails = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(createOrderPreset.pending, (state) => {
      state.isCreating = true;
    });
    builder.addCase(createOrderPreset.fulfilled, (state) => {
      state.isCreating = false;
    });
    builder.addCase(createOrderPreset.rejected, (state, action) => {
      state.isCreating = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(updateOrderPreset.pending, (state) => {
      state.isUpdating = true;
    });
    builder.addCase(updateOrderPreset.fulfilled, (state) => {
      state.isUpdating = false;
    });
    builder.addCase(updateOrderPreset.rejected, (state, action) => {
      state.isUpdating = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(fillCartFromPreset.pending, (state) => {
      state.isFillingCart = true;
    });
    builder.addCase(fillCartFromPreset.fulfilled, (state) => {
      state.isFillingCart = false;
    });
    builder.addCase(fillCartFromPreset.rejected, (state, action) => {
      state.isFillingCart = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(deleteOrderPresetItemsBulk.pending, (state) => {
      state.isDeletingBulk = true;
    });
    builder.addCase(deleteOrderPresetItemsBulk.fulfilled, (state) => {
      state.isDeletingBulk = false;
    });
    builder.addCase(deleteOrderPresetItemsBulk.rejected, (state, action) => {
      state.isDeletingBulk = false;
      axiosErrorHandler(action?.payload);
    });
  },
});

export const { setActivePresetId, clearActivePreset, clearPresetDetails } =
  orderPresetsSlice.actions;

export default orderPresetsSlice.reducer;

