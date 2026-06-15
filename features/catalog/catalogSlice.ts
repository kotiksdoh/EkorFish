// features/catalog/catalogSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosErrorHandler } from "../shared/services/api";
import { axdef } from "../shared/services/axios";
import { adaptProductsArray } from "../shared/services/productAdapter";
import { adaptProductSingleObj } from "../shared/services/productSingleAdapter";

interface FilterOption {
  id: string;
  value: string;
}

interface CategoryFilter {
  id: string;
  name: string;
  filterOptions: FilterOption[];
}
interface DeliveryAddress {
  id: string;
  address: string;
  apartment?: string;
  floor?: string;
  entrance?: string;
  intercom?: string;
  comment?: string;
}

// Интерфейс для получателя
interface Recipient {
  id?: string;
  fullname: string;
  phoneNumber: string;
  email: string;
  deliveryAddressId?: string;
}

interface ReturnRequest {
      orderId: number;
      items: Array<{
        orderProductId: string;
        returnQuantity: number;
        /** Не задана до шага с причиной; 0 — валидный id с бэкенда */
        reason?: number;
        comment: string;
      }>;
}

interface ReturnRequestDetailItem {
  id: string;
  orderProductId: string;
  productName: string;
  productImage?: string;
  returnQuantity: number;
  measureType: string;
  unitPrice: number;
  reason: number;
  comment: string;
}

interface ReturnRequestDetailOrder {
  orderId: number;
  orderCreatedAt: string;
  items: ReturnRequestDetailItem[];
}

interface ReturnRequestDetail {
  id: number;
  createdAt: string;
  status: number;
  refundMethod: number;
  returnMethod: number;
  deliveryAddress?: string | null;
  storageName?: string | null;
  orders: ReturnRequestDetailOrder[];
  totalAmount: number;
  totalWeight: number;
}
type ProductListMode = "favorites" | "catalog";

function getProductListMode(params: { isFavorite?: boolean }): ProductListMode {
  return params?.isFavorite === true ? "favorites" : "catalog";
}

function normalizeCategoryId(categoryId: unknown): string | null {
  if (categoryId === undefined || categoryId === null || categoryId === "") {
    return null;
  }
  return String(categoryId);
}

function normalizeSubcategoryId(subcategoryId: unknown): string | null {
  if (
    subcategoryId === undefined ||
    subcategoryId === null ||
    subcategoryId === "" ||
    subcategoryId === "all"
  ) {
    return null;
  }
  return String(subcategoryId);
}

function isStaleProductListResponse(
  state: CategoryState,
  requestMode: ProductListMode,
  requestCategoryId: string | null,
  requestSubcategoryId?: unknown,
): boolean {
  if (
    state.activeProductListMode !== null &&
    requestMode !== state.activeProductListMode
  ) {
    return true;
  }

  if (requestMode === "catalog") {
    if (requestCategoryId !== state.activeCategoryId) {
      return true;
    }

    return (
      normalizeSubcategoryId(requestSubcategoryId) !==
      normalizeSubcategoryId(state.selectedSubcategoryId)
    );
  }

  return false;
}

interface CategoryState {
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingFilters: boolean;
  /** Режим активного списка — отсекает ответы API после смены каталог ↔ избранное */
  activeProductListMode: ProductListMode | null;
  /** Текущая категория списка — отсекает ответы после смены категории */
  activeCategoryId: string | null;
  /** Текущий товар на экране деталки — отсекает ответы после смены товара */
  activeProductId: string | null;
  products: any[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  filters: CategoryFilter[];
  filtersCategoryId: string | null;
  selectedFilterIds: string[];
  selectedSubcategoryId: string | null; // Добавляем состояние для выбранной подкатегории
  product: any;
  isLoadingProduct: boolean;
  isNavigatingToProduct: boolean;

  cart: any[];
  isLoadingCart: boolean;
  updatingCartItemIds: string[];
  isLoadingOrders: boolean;
  orders: any[];

  order: any;

  returns: any[];
  return: ReturnRequestDetail | null;
  isLoadingReturns: boolean;
  isLoadingReturnDetail: boolean;
  returnsStatuses: any[]
  returnableOrders: any[],
  returnableOrdersLoading: boolean,

  addresses: DeliveryAddress[];
  recipients: Recipient[];
  isLoadingAddresses: boolean;
  isLoadingRecipients: boolean;
  isAddingAddress: boolean;
  isCreatingRecipients: boolean;
  isCreatingOrder: boolean;
  orderResponse: any;

  returnRequests: {
    orders: ReturnRequest[];
  } 
}

const initialState: CategoryState = {
  isLoading: false,
  isLoadingMore: false,
  isLoadingFilters: false,
  activeProductListMode: null,
  activeCategoryId: null,
  activeProductId: null,
  products: [],
  totalCount: 0,
  currentPage: 0,
  hasMore: true,
  filters: [],
  filtersCategoryId: null,
  selectedFilterIds: [],
  selectedSubcategoryId: null, 
  product: null,
  isLoadingProduct: false,
  isNavigatingToProduct: false,
  isLoadingOrders: false,

  returnsStatuses: [],
  returnableOrders: [],
  returnableOrdersLoading: false,
  orders: [],
  cart: [],
  updatingCartItemIds: [],

  isLoadingCart: false,
  order: null,

  returns: [],
  return: null,
  isLoadingReturns: false,
  isLoadingReturnDetail: false,

  addresses: [],
  recipients: [],
  isLoadingRecipients: false,
  isCreatingRecipients: false,
  isCreatingOrder: false,
  orderResponse: null,
  isLoadingAddresses: false,
  isAddingAddress: false,

  returnRequests: {
    orders: []
  }
};

export const addDeliveryAddress = createAsyncThunk(
  "catalog/addDeliveryAddress",
  async (
    {
      companyId,
      addressData,
    }: {
      companyId: string;
      addressData: {
        address: string;
        apartment?: string | null;
        floor?: string | null;
        entrance?: string | null;
        intercom?: string | null;
        comment?: string | null;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axdef.post(
        `/api/Account/companies/${companyId}/addresses`,
        addressData,
      );
      return response.data.data;
    } catch (error: any) {
      console.log("Error adding address:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

// export const getAddressRecipients = createAsyncThunk(
//   "catalog/getAddressRecipients",
//   async (deliveryAddressId: string, { rejectWithValue }) => {
//     try {
//       const response = await axdef.get(`/api/Account/companies/addresses/${deliveryAddressId}/recepients`);
//       return response.data.data;
//     } catch (error: any) {
//       console.log('Error getting recipients:', error);
//       if (error.response?.status !== 401) {
//         return rejectWithValue(error);
//       }
//       throw error;
//     }
//   }
// );

export const getCompanyAddresses = createAsyncThunk(
  "catalog/getCompanyAddresses",
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(
        `/api/Account/companies/${companyId}/addresses`,
      );
      return response.data.data;
    } catch (error: any) {
      console.log("Error getting addresses:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);
export const getProductList = createAsyncThunk(
  "user/getProductList",
  async (
    payload: {
      params: any;
      isLoadMore?: boolean;
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { catalog: CategoryState };
      const { selectedFilterIds } = state.catalog;
      const params = new URLSearchParams();

      // Добавляем основные параметры
      // if(payload.params.isFavorite)
      // params.append('isFavorite', 'false');
      if (payload.params.isFavorite !== undefined) {
        params.append("isFavorite", payload.params.isFavorite);
      }
      if (payload.params.categoryId) {
        params.append("categoryId", payload.params.categoryId);
      }

      if (
        payload.params.isFavorite !== true &&
        payload.params.subCategoryId &&
        payload.params.subCategoryId !== "all"
      ) {
        params.append("subCategoryId", payload.params.subCategoryId);
      }

      if (payload.params.offset !== undefined) {
        params.append("offset", payload.params.offset.toString());
      }
      if (payload.params.isPromo !== undefined) {
        params.append("isPromo", payload.params.isPromo);
      }
      if (payload.params.count !== undefined) {
        params.append("count", payload.params.count.toString());
      }
      if (payload.params.search) {
        params.append("search", payload.params.search);
      }
      if (payload.params.MinPrice !== undefined) {
        params.append("MinPrice", payload.params.MinPrice.toString());
      }
      if (payload.params.MaxPrice !== undefined) {
        params.append("MaxPrice", payload.params.MaxPrice.toString());
      }
      if (payload.params.MinRemainingShelfLifePercent !== undefined) {
        params.append(
          "MinRemainingShelfLifePercent",
          payload.params.MinRemainingShelfLifePercent.toString(),
        );
      }
      if (payload.params.MaxRemainingShelfLifePercent !== undefined) {
        params.append(
          "MaxRemainingShelfLifePercent",
          payload.params.MaxRemainingShelfLifePercent.toString(),
        );
      }
      if (payload.params.SortBy !== undefined) {
        params.append("SortBy", String(payload.params.SortBy));
      }
      if (payload.params.IsDesc !== undefined) {
        params.append("IsDesc", String(payload.params.IsDesc));
      }
      if (payload.params.storageId !== undefined) {
        params.append("storageId", payload.params.storageId.toString());
      }

      if (selectedFilterIds.length > 0) {
        selectedFilterIds.forEach((filterId) => {
          params.append("ProductFilterIds", filterId);
        });
      }

      const data = await axdef.get("/api/Catalog/product/list", {
        params: params,
        paramsSerializer: function (params) {
          return params.toString();
        },
      });

      return {
        data: data.data,
        isLoadMore: payload.isLoadMore || false,
        offset: payload.params.offset || 0,
      };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getCategoryFilters = createAsyncThunk(
  "catalog/getCategoryFilters",
  async (categoryId: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/filters", {
        params: { categoryId },
      });
      return data.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getProduct = createAsyncThunk(
  "catalog/getProduct",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/product", {
        params: { productId },
      });
      return data.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const putFavorite = createAsyncThunk(
  "catalog/putFavorite",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await axdef.put(
        `/api/Catalog/product/favorite?productId=${productId}`,
      );
      return data.data.data;
    } catch (error: any) {
      console.log("Error in thunk:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error; 
    }
  },
);

export const putUnFavorite = createAsyncThunk(
  "catalog/putUnFavorite",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await axdef.put(
        `/api/Catalog/product/unfavorite?productId=${productId}`,
      );
      return data.data.data;
    } catch (error: any) {
      console.log("Error in thunk:", error);


      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }

      throw error; 
    }
  },
);

export const AddToCart = createAsyncThunk(
  "catalog/AddToCart",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.post(`/api/Account/cart`, payload);
      return data.data.data;
    } catch (error: any) {
      console.log("Error in thunk:", error);

      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getCart = createAsyncThunk(
  "catalog/getCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axdef.get("/api/Account/cart");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getMyOrders = createAsyncThunk(
  "catalog/getMyOrders",
  async (
    paramsPayload:
      | {
          offset?: number;
          count?: number;
          isActive?: boolean;
        }
      | undefined,
    { rejectWithValue },
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (paramsPayload?.offset !== undefined) {
        queryParams.append("offset", String(paramsPayload.offset));
      }
      if (paramsPayload?.count !== undefined) {
        queryParams.append("count", String(paramsPayload.count));
      }
      if (paramsPayload?.isActive !== undefined) {
        queryParams.append("isActive", String(paramsPayload.isActive));
      }

      const endpoint = queryParams.toString()
        ? `/api/Order?${queryParams.toString()}`
        : "/api/Order";

      const response = await axdef.get(endpoint);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const checkForReorder = createAsyncThunk(
  "catalog/checkForReorder",
  async (orderId: number | string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(`/api/Order/${orderId}/check-for-reorder`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const reorderOrder = createAsyncThunk(
  "catalog/reorderOrder",
  async (orderId: number | string, { rejectWithValue }) => {
    try {
      const response = await axdef.post(`/api/Order/${orderId}/reorder`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getMyReturns = createAsyncThunk(
  "catalog/getMyReturns",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axdef.get("/api/ReturnRequest/my-requests");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getReturnRequestDetail = createAsyncThunk(
  "catalog/getReturnRequestDetail",
  async (returnRequestId: number | string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(`/api/ReturnRequest/${returnRequestId}`);
      return response.data.data as ReturnRequestDetail;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getMyReturnsParams = createAsyncThunk(
  "catalog/getMyReturnsParams",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axdef.get("/api/ReturnRequest/page-data");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getMyReturnableOrders = createAsyncThunk(
  "catalog/getMyReturnableOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axdef.get("/api/ReturnRequest/returnable-orders");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);



export const removeMultipleFromCart = createAsyncThunk(
  "catalog/removeMultipleFromCart",
  async (cartItemIds: string[], { rejectWithValue }) => {
    try {
      // Формируем параметры запроса: cartItemIds=kzkzkz&cartItemIds=kzkzk
      const params = new URLSearchParams();
      cartItemIds.forEach((id) => {
        params.append("cartItemIds", id);
      });

      const response = await axdef.delete(
        `/api/Account/cart?${params.toString()}`,
      );
      return { cartItemIds, data: response.data };
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const updateCartItemQuantitys = createAsyncThunk(
  "catalog/updateCartItemQuantity",
  async (
    { cartItemId, quantity }: { cartItemId: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await axdef.put(`/api/Account/cart/${cartItemId}`, {
        quantity,
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const toggleCartItemFavorite = createAsyncThunk(
  "catalog/toggleCartItemFavorite",
  async (
    {
      cartItemId,
      productId,
      isFavorite,
    }: { cartItemId: string; productId: string; isFavorite: boolean },
    { rejectWithValue },
  ) => {
    try {
      // Здесь должен быть эндпоинт для избранного в корзине
      // Если такого нет, используй существующий putFavorite
      const response = await axdef.put(
        `/api/Catalog/product/favorite?productId=${productId}`,
      );
      return { cartItemId, isFavorite: !isFavorite };
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const getOrderPageData = createAsyncThunk(
  "catalog/getOrderPageData",
  async (_, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Order/page-data");
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getRecipients = createAsyncThunk(
  "catalog/getRecipients",
  async (deliveryAddressId: string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(
        `/api/Account/companies/addresses/${deliveryAddressId}/recepients`,
      );
      return response.data.data;
    } catch (error: any) {
      console.log("Error getting recipients:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);
export const createRecipient = createAsyncThunk(
  "catalog/createRecipient",
  async (
    {
      deliveryAddressId,
      recipientData,
    }: {
      deliveryAddressId: string;
      recipientData: {
        fullname: string;
        phoneNumber: string;
        email: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axdef.post(
        `/api/Account/companies/addresses/${deliveryAddressId}/recepients`,
        recipientData,
      );
      return response.data.data;
    } catch (error: any) {
      console.log("Error creating recipient:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);
// Создание получателей
export const createRecipients = createAsyncThunk(
  "catalog/createRecipients",
  async (
    {
      deliveryAddressId,
      recipients,
    }: {
      deliveryAddressId: string;
      recipients: Recipient[];
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axdef.post(
        `/api/Account/companies/addresses/${deliveryAddressId}/recepients`,
        recipients,
      );
      return response.data.data;
    } catch (error: any) {
      console.log("Error creating recipients:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const deleteRecipient = createAsyncThunk(
  "catalog/deleteRecipient",
  async (recipientId: string, { rejectWithValue }) => {
    try {
      await axdef.delete(
        `/api/Account/companies/addresses/recepients/${recipientId}`,
      );
      return recipientId;
    } catch (error: any) {
      console.log("Error deleting recipient:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);
// getMyOrders
// Создание заказа
export const createOrder = createAsyncThunk(
  "catalog/createOrder",
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await axdef.post(`/api/Order`, orderData);
      return response.data;
    } catch (error: any) {
      console.log("Error creating order:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

export const createReturnRequest = createAsyncThunk(
  "catalog/createReturnRequest",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await axdef.post("/api/ReturnRequest", payload);
      return response.data;
    } catch (error: any) {
      console.log("Error creating return request:", error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  },
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    clearCatalogState: (state) => {
      return initialState;
    },
    clearProducts: (state) => {
      state.isLoadingMore = false;
      state.products = [];
      state.totalCount = 0;
      state.currentPage = 0;
      state.hasMore = true;
      state.selectedFilterIds = [];
      state.selectedSubcategoryId = null;
    },
    interruptProductListLoading: (state) => {
      state.isLoading = false;
      state.isLoadingMore = false;
    },
    resetPagination: (state) => {
      state.products = [];
      state.currentPage = 0;
      state.hasMore = true;
      state.totalCount = 0;
      state.selectedFilterIds = [];
      state.selectedSubcategoryId = null;
    },
    toggleFilterSelection: (state, action) => {
      const filterId = action.payload;
      const index = state.selectedFilterIds.indexOf(filterId);

      if (index === -1) {
        state.selectedFilterIds.push(filterId);
      } else {
        state.selectedFilterIds.splice(index, 1);
      }
    },
    clearSelectedFilters: (state) => {
      state.selectedFilterIds = [];
    },
    setSelectedFilters: (state, action) => {
      state.selectedFilterIds = action.payload;
    },
    // Действия для подкатегорий
    setSelectedSubcategory: (state, action) => {
      state.selectedSubcategoryId = action.payload;
      // Сбрасываем пагинацию при смене подкатегории
      state.products = [];
      state.currentPage = 0;
      state.hasMore = true;
    },
    clearSelectedSubcategory: (state) => {
      state.selectedSubcategoryId = null;
      // Сбрасываем пагинацию при сбросе подкатегории
      state.products = [];
      state.currentPage = 0;
      state.hasMore = true;
    },
    setProductNavigationPending: (state, action) => {
      state.isNavigatingToProduct = action.payload;
    },
    setProductPreview: (
      state,
      action: { payload: { productId: string; preview: any } },
    ) => {
      state.activeProductId = action.payload.productId;
      state.product = action.payload.preview;
      state.isLoadingProduct = true;
      state.isNavigatingToProduct = true;
    },
    clearProduct: (state) => {
      state.product = null;
      state.activeProductId = null;
      state.isLoadingProduct = false;
      state.isNavigatingToProduct = false;
    },
    updateCartItemQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const itemIndex = state.cart.findIndex((item) => item.id === cartItemId);
      if (itemIndex !== -1) {
        state.cart[itemIndex].quantity = quantity;
        state.cart[itemIndex].totalPrice =
          state.cart[itemIndex].price * quantity;
      }
    },
    removeCartItem: (state, action) => {
      const cartItemId = action.payload;
      state.cart = state.cart.filter((item) => item.id !== cartItemId);
    },
    clearCart: (state) => {
      state.cart = [];
    },
    clearAddresses: (state) => {
      state.addresses = [];
    },
    clearRecipients: (state) => {
      state.recipients = [];
    },
    updateReturnRequestItem: (state, action) => {
      const { orderId, orderProductId, returnQuantity, reason, comment } = action.payload;
      const hasItemsFromAnotherOrder = state.returnRequests.orders.some(
        (order) => order.orderId !== orderId && order.items.some((item) => item.returnQuantity > 0)
      );
      const shouldSelectItem = (returnQuantity ?? 0) > 0;

      if (shouldSelectItem && hasItemsFromAnotherOrder) {
        state.returnRequests.orders = [];
      }
      
      const orderIndex = state.returnRequests.orders.findIndex(
        (order) => order.orderId === orderId
      );
      
      if (orderIndex === -1) {
        // Создаем новый заказ в запросе
        state.returnRequests.orders.push({
          orderId,
          items: [{
            orderProductId,
            returnQuantity: returnQuantity || 0,
            comment: comment || "",
            ...(reason !== undefined ? { reason } : {}),
          }]
        });
      } else {
        const itemIndex = state.returnRequests.orders[orderIndex].items.findIndex(
          (item) => item.orderProductId === orderProductId
        );
        
        if (itemIndex === -1 && (returnQuantity > 0 || reason !== undefined)) {
          // Добавляем новый товар в существующий заказ
          state.returnRequests.orders[orderIndex].items.push({
            orderProductId,
            returnQuantity: returnQuantity || 0,
            comment: comment || "",
            ...(reason !== undefined ? { reason } : {}),
          });
        } else if (itemIndex !== -1) {
          const currentItem = state.returnRequests.orders[orderIndex].items[itemIndex];
          
          if (returnQuantity === 0 && reason === undefined) {
            state.returnRequests.orders[orderIndex].items.splice(itemIndex, 1);
            if (state.returnRequests.orders[orderIndex].items.length === 0) {
              state.returnRequests.orders.splice(orderIndex, 1);
            }
          } else {
            // Обновляем поля
            if (returnQuantity !== undefined) {
              currentItem.returnQuantity = returnQuantity;
            }
            if (reason !== undefined) {
              currentItem.reason = reason;
            }
            if (comment !== undefined) {
              currentItem.comment = comment;
            }
          }
        }
      }
    },
    updateReturnItemReason: (state, action) => {
      const { orderId, orderProductId, reason, comment } = action.payload;
      
      const orderIndex = state.returnRequests.orders.findIndex(
        (order) => order.orderId === orderId
      );
      
      if (orderIndex !== -1) {
        const itemIndex = state.returnRequests.orders[orderIndex].items.findIndex(
          (item) => item.orderProductId === orderProductId
        );
        
        if (itemIndex !== -1) {
          state.returnRequests.orders[orderIndex].items[itemIndex].reason = reason;
          state.returnRequests.orders[orderIndex].items[itemIndex].comment = comment || "";
        }
      }
    },
    clearReturnRequests: (state) => {
      state.returnRequests = { orders: [] };
    },
    
  },
  extraReducers: (builder) => {
    builder.addCase(getRecipients.pending, (state) => {
      state.isLoadingRecipients = true;
    });

    builder.addCase(getRecipients.fulfilled, (state, action) => {
      state.recipients = action.payload || [];
      state.isLoadingRecipients = false;
    });

    builder.addCase(getRecipients.rejected, (state, action) => {
      state.isLoadingRecipients = false;
      axiosErrorHandler(action?.payload);
    });

    // createRecipients
    builder.addCase(createRecipients.pending, (state) => {
      state.isCreatingRecipients = true;
    });

    builder.addCase(createRecipients.fulfilled, (state, action) => {
      state.recipients = action.payload || [];
      state.isCreatingRecipients = false;
    });

    builder.addCase(createRecipients.rejected, (state, action) => {
      state.isCreatingRecipients = false;
      axiosErrorHandler(action?.payload);
    });

    // deleteRecipient
    builder.addCase(deleteRecipient.fulfilled, (state, action) => {
      state.recipients = state.recipients.filter(
        (r) => r.id !== action.payload,
      );
    });

    // createOrder
    builder.addCase(createOrder.pending, (state) => {
      state.isCreatingOrder = true;
    });

    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.isCreatingOrder = false;
      state.orderResponse = action.payload;
    });

    builder.addCase(createOrder.rejected, (state, action) => {
      state.isCreatingOrder = false;
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(createRecipient.pending, (state) => {
      state.isCreatingRecipients = true;
    });

    builder.addCase(createRecipient.fulfilled, (state, action) => {
      if (action.payload) {
        state.recipients = [...state.recipients, action.payload];
      }
      state.isCreatingRecipients = false;
    });

    builder.addCase(createRecipient.rejected, (state, action) => {
      state.isCreatingRecipients = false;
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(getProductList.pending, (state, action) => {
      const isLoadMore = action.meta.arg?.isLoadMore || false;
      const requestMode = getProductListMode(action.meta.arg?.params ?? {});
      const requestCategoryId = normalizeCategoryId(
        action.meta.arg?.params?.categoryId,
      );

      if (!isLoadMore) {
        state.activeProductListMode = requestMode;
        state.activeCategoryId =
          requestMode === "catalog" ? requestCategoryId : null;
      }

      if (isLoadMore) {
        state.isLoadingMore = true;
      } else {
        state.isLoading = true;
      }
    });

    builder.addCase(getProductList.fulfilled, (state, action) => {
      const requestMode = getProductListMode(action.meta.arg?.params ?? {});
      const requestCategoryId = normalizeCategoryId(
        action.meta.arg?.params?.categoryId,
      );
      const requestSubcategoryId = action.meta.arg?.params?.subCategoryId;

      if (
        isStaleProductListResponse(
          state,
          requestMode,
          requestCategoryId,
          requestSubcategoryId,
        )
      ) {
        state.isLoading = false;
        state.isLoadingMore = false;
        return;
      }

      const { data, isLoadMore } = action.payload;
      const adaptedProducts = adaptProductsArray(data.data || []);

      if (isLoadMore) {
        const existingIds = new Set(
          state.products.map((product: { id?: string | number }) => product.id),
        );
        const uniqueProducts = adaptedProducts.filter(
          (product: { id?: string | number }) => !existingIds.has(product.id),
        );
        state.products = [...state.products, ...uniqueProducts];
        state.isLoadingMore = false;
        state.currentPage += 1;
        if (uniqueProducts.length === 0) {
          state.hasMore = false;
        }
      } else {
        // Для первой загрузки или поиска заменяем
        state.products = adaptedProducts;
        state.isLoading = false;
        state.currentPage = 0;
      }

      const pageSize = Number(action.meta.arg?.params?.count) || 10;
      const loadedCount = adaptedProducts.length;
      if (isLoadMore) {
        state.hasMore = loadedCount >= pageSize && state.hasMore;
      } else {
        state.hasMore = loadedCount >= pageSize;
      }

    });

    builder.addCase(getProductList.rejected, (state, action) => {
      const requestMode = getProductListMode(action.meta.arg?.params ?? {});
      const requestCategoryId = normalizeCategoryId(
        action.meta.arg?.params?.categoryId,
      );
      const requestSubcategoryId = action.meta.arg?.params?.subCategoryId;

      if (
        isStaleProductListResponse(
          state,
          requestMode,
          requestCategoryId,
          requestSubcategoryId,
        )
      ) {
        return;
      }

      state.isLoading = false;
      state.isLoadingMore = false;
      state.hasMore = false;
      axiosErrorHandler(action?.payload);
    });

    // Обработчики для фильтров
    builder.addCase(getCategoryFilters.pending, (state, action) => {
      state.isLoadingFilters = true;
      const requestCategoryId = String(action.meta.arg ?? "");
      if (requestCategoryId && requestCategoryId !== state.filtersCategoryId) {
        state.filters = [];
      }
    });

    builder.addCase(getCategoryFilters.fulfilled, (state, action) => {
      state.filters = action.payload || [];
      state.filtersCategoryId = String(action.meta.arg ?? "");
      state.isLoadingFilters = false;
    });

    builder.addCase(getCategoryFilters.rejected, (state, action) => {
      state.isLoadingFilters = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(AddToCart.pending, (state) => {
      state.isLoadingCart = true;
    });

    builder.addCase(AddToCart.fulfilled, (state, action) => {
      const cartItem = action.payload || action.payload?.data;

      if (cartItem) {
        // Ищем существующий товар по productId И productPurchaseOptionId
        const existingItemIndex = state.cart.findIndex(
          (item) =>
            item.productId === cartItem.productId &&
            item.productPurchaseOptionId === cartItem.productPurchaseOptionId, // Важно!
        );

        if (existingItemIndex !== -1) {
          // Обновляем существующий товар (заменяем, а не суммируем)
          state.cart[existingItemIndex] = {
            ...state.cart[existingItemIndex],
            ...cartItem,
          };
        } else {
          // Добавляем новый товар
          if (Array.isArray(state.cart)) {
            state.cart = [...state.cart, cartItem];
          } else {
            state.cart = [cartItem];
          }
        }
      }
      state.isLoadingCart = false;
    });

    builder.addCase(AddToCart.rejected, (state, action) => {
      state.isLoadingCart = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getProduct.pending, (state, action) => {
      const requestProductId = String(action.meta.arg ?? "");
      state.activeProductId = requestProductId;
      if (
        !state.product ||
        String(state.product.id) !== requestProductId
      ) {
        state.product = null;
      }
      state.isLoadingProduct = true;
      state.isNavigatingToProduct = true;
    });

    builder.addCase(getProduct.fulfilled, (state, action) => {
      const requestProductId = String(action.meta.arg ?? "");
      if (requestProductId !== state.activeProductId) {
        return;
      }
      state.product = adaptProductSingleObj(action.payload);
      state.isLoadingProduct = false;
      state.isNavigatingToProduct = false;
    });

    builder.addCase(getProduct.rejected, (state, action) => {
      const requestProductId = String(action.meta.arg ?? "");
      if (requestProductId !== state.activeProductId) {
        return;
      }
      state.isLoadingProduct = false;
      state.isNavigatingToProduct = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(putFavorite.pending, (state) => {});

    builder.addCase(putFavorite.fulfilled, (state, action) => {
      console.log("action.payload", action.payload);
    });

    builder.addCase(putFavorite.rejected, (state, action) => {
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(getCart.pending, (state) => {
      state.isLoadingCart = true;
    });

    builder.addCase(getCart.fulfilled, (state, action) => {
      state.cart = action.payload || [];
      state.isLoadingCart = false;
    });

    builder.addCase(getCart.rejected, (state, action) => {
      state.isLoadingCart = false;
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(getMyOrders.pending, (state) => {
      state.isLoadingOrders = true;
    });

    builder.addCase(getMyOrders.fulfilled, (state, action) => {
      state.orders = action.payload || [];
      state.isLoadingOrders = false;
    });

    builder.addCase(getMyOrders.rejected, (state, action) => {
      state.isLoadingOrders = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getMyReturns.pending, (state) => {
      state.isLoadingReturns = true;
    });

    builder.addCase(getMyReturns.fulfilled, (state, action) => {
      state.returns = action.payload || [];
      state.isLoadingReturns = false;
    });

    builder.addCase(getMyReturns.rejected, (state, action) => {
      state.isLoadingReturns = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getReturnRequestDetail.pending, (state) => {
      state.isLoadingReturnDetail = true;
      state.return = null;
    });

    builder.addCase(getReturnRequestDetail.fulfilled, (state, action) => {
      state.return = action.payload || null;
      state.isLoadingReturnDetail = false;
    });

    builder.addCase(getReturnRequestDetail.rejected, (state, action) => {
      state.isLoadingReturnDetail = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getMyReturnableOrders.pending, (state) => {
      state.returnableOrdersLoading = true;
    });

    builder.addCase(getMyReturnableOrders.fulfilled, (state, action) => {
      state.returnableOrders = action.payload || [];
      state.returnableOrdersLoading = false;
    });

    builder.addCase(getMyReturnableOrders.rejected, (state, action) => {
      state.isLoadingReturns = false;
      axiosErrorHandler(action?.payload);
    });
    

    builder.addCase(    getMyReturnsParams
      .pending, (state) => {
      state.returnableOrdersLoading = true;
    });

    builder.addCase(    getMyReturnsParams
      .fulfilled, (state, action) => {
      state.returnsStatuses = action.payload || [];
      state.isLoadingReturns = false;
    });

    builder.addCase(    getMyReturnsParams
      .rejected, (state, action) => {
      state.isLoadingReturns = false;
      axiosErrorHandler(action?.payload);
    });
    
    builder.addCase(removeMultipleFromCart.fulfilled, (state, action) => {
      const { cartItemIds } = action.payload;
      state.cart = state.cart.filter((item) => !cartItemIds.includes(item.id));
    });

    builder.addCase(updateCartItemQuantitys.pending, (state, action) => {
      const cartItemId = String(action.meta.arg?.cartItemId ?? "");
      if (
        cartItemId &&
        !state.updatingCartItemIds.includes(cartItemId)
      ) {
        state.updatingCartItemIds.push(cartItemId);
      }
    });

    builder.addCase(updateCartItemQuantitys.fulfilled, (state, action) => {
      const cartItemId = String(action.meta.arg?.cartItemId ?? "");
      state.updatingCartItemIds = state.updatingCartItemIds.filter(
        (id) => id !== cartItemId,
      );

      const updatedItem = action.payload;
      const index = state.cart.findIndex((item) => item.id === updatedItem.id);
      if (index !== -1) {
        state.cart[index] = updatedItem;
      }
    });

    builder.addCase(updateCartItemQuantitys.rejected, (state, action) => {
      const cartItemId = String(action.meta.arg?.cartItemId ?? "");
      state.updatingCartItemIds = state.updatingCartItemIds.filter(
        (id) => id !== cartItemId,
      );
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(toggleCartItemFavorite.fulfilled, (state, action) => {
      const { cartItemId, isFavorite } = action.payload;
      const index = state.cart.findIndex((item) => item.id === cartItemId);
      if (index !== -1) {
        state.cart[index].isFavorite = isFavorite;
      }
    });

    builder.addCase(getOrderPageData.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(getOrderPageData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.order = action.payload.data.data;
      console.log("Order page data:", action.payload.data);
      // Здесь можно сохранить данные в state
    });

    builder.addCase(getOrderPageData.rejected, (state, action) => {
      state.isLoading = false;
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(addDeliveryAddress.pending, (state) => {
      state.isAddingAddress = true;
    });

    builder.addCase(addDeliveryAddress.fulfilled, (state, action) => {
      state.isAddingAddress = false;
      // Если API возвращает созданный адрес, можно добавить его в список
      if (action.payload) {
        state.addresses = [...state.addresses, action.payload];
      }
    });

    builder.addCase(addDeliveryAddress.rejected, (state, action) => {
      state.isAddingAddress = false;
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(getCompanyAddresses.pending, (state) => {
      state.isLoadingAddresses = true;
    });

    builder.addCase(getCompanyAddresses.fulfilled, (state, action) => {
      state.addresses = action.payload || [];
      state.isLoadingAddresses = false;
    });

    builder.addCase(getCompanyAddresses.rejected, (state, action) => {
      state.isLoadingAddresses = false;
      axiosErrorHandler(action?.payload);
    });
  },
});

export const {
  clearProducts,
  resetPagination,
  interruptProductListLoading,
  toggleFilterSelection,
  clearSelectedFilters,
  setSelectedFilters,
  setSelectedSubcategory,
  clearSelectedSubcategory,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  clearAddresses,
  clearRecipients,
  clearCatalogState,
  updateReturnRequestItem,  
  clearReturnRequests,
  updateReturnItemReason,
  setProductNavigationPending,
  setProductPreview,
  clearProduct,
} = catalogSlice.actions;
export default catalogSlice.reducer;
