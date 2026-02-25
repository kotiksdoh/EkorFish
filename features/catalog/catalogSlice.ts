// features/catalog/catalogSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { axiosErrorHandler } from '../shared/services/api';
import { axdef } from '../shared/services/axios';
import { adaptProductsArray } from '../shared/services/productAdapter';
import { adaptProductSingleObj } from '../shared/services/productSingleAdapter';

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
interface CategoryState {
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingFilters: boolean;
  products: any[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  filters: CategoryFilter[];
  selectedFilterIds: string[];
  selectedSubcategoryId: string | null; // Добавляем состояние для выбранной подкатегории
  product: any;
  isLoadingProduct: boolean;

  cart: any[];
  isLoadingCart: boolean;

  order: any;

  addresses: DeliveryAddress[];
  recipients: Recipient[];
  isLoadingAddresses: boolean;
  isLoadingRecipients: boolean;
  isAddingAddress: boolean;
  isCreatingRecipients: boolean;
  isCreatingOrder: boolean;
  orderResponse: any;
}

const initialState: CategoryState = {
  isLoading: false,
  isLoadingMore: false,
  isLoadingFilters: false,
  products: [],
  totalCount: 0,
  currentPage: 0,
  hasMore: true,
  filters: [],
  selectedFilterIds: [],
  selectedSubcategoryId: null, // Инициализируем как null
  product: null,
  isLoadingProduct: false,

  cart: [],
  isLoadingCart: false,
  order: null,
  addresses: [],
  recipients: [],
  isLoadingRecipients: false,
  isCreatingRecipients: false,
  isCreatingOrder: false,
  orderResponse: null,
  isLoadingAddresses: false,
  isAddingAddress: false,
};

export const addDeliveryAddress = createAsyncThunk(
  "catalog/addDeliveryAddress",
  async ({ 
    companyId, 
    addressData 
  }: { 
    companyId: string; 
    addressData: {
      address: string;
      apartment?: string | null;
      floor?: string | null;
      entrance?: string | null;
      intercom?: string | null;
      comment?: string | null;
    }
  }, { rejectWithValue }) => {
    try {
      const response = await axdef.post(`/api/Account/companies/${companyId}/addresses`, addressData);
      return response.data.data;
    } catch (error: any) {
      console.log('Error adding address:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);

// // НОВЫЙ МЕТОД: Получение списка получателей для адреса
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

// НОВЫЙ МЕТОД: Получение всех адресов компании (если нужен)
export const getCompanyAddresses = createAsyncThunk(
  "catalog/getCompanyAddresses",
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(`/api/Account/companies/${companyId}/addresses`);
      return response.data.data;
    } catch (error: any) {
      console.log('Error getting addresses:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);
export const getProductList = createAsyncThunk(
  "user/getProductList",
  async (payload: { 
    params: any, 
    isLoadMore?: boolean
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { catalog: CategoryState };
      const { selectedFilterIds, selectedSubcategoryId } = state.catalog;
      
      // Создаем параметры
      const params = new URLSearchParams();
      
      // Добавляем основные параметры
      console.log('payload.params.isFavorite', payload.params.isFavorite)
      // if(payload.params.isFavorite)
      // params.append('isFavorite', 'false');
      if (payload.params.isFavorite !== undefined) {
        params.append('isFavorite', payload.params.isFavorite);
      }
      if (payload.params.categoryId) {
        params.append('categoryId', payload.params.categoryId);
      }
      
      // Добавляем подкатегорию если выбрана (кроме 'all')
      if (selectedSubcategoryId && selectedSubcategoryId !== 'all') {
        params.append('subCategoryId', selectedSubcategoryId);
      }
      
      if (payload.params.offset !== undefined) {
        params.append('offset', payload.params.offset.toString());
      }
      if (payload.params.count !== undefined) {
        params.append('count', payload.params.count.toString());
      }
      if (payload.params.Search) {
        params.append('Search', payload.params.Search);
      }
      if (payload.params.MinPrice !== undefined) {
        params.append('MinPrice', payload.params.MinPrice.toString());
      }
      if (payload.params.MaxPrice !== undefined) {
        params.append('MaxPrice', payload.params.MaxPrice.toString());
      }
      if (payload.params.storageId !== undefined) {
        params.append('storageId', payload.params.storageId.toString());
      }
      
      // Добавляем фильтры
      if (selectedFilterIds.length > 0) {
        selectedFilterIds.forEach(filterId => {
          params.append('ProductFilterIds', filterId);
        });
      }
      
      console.log('API params:', params.toString());
      
      const data = await axdef.get("/api/Catalog/product/list", {
        params: params,
        paramsSerializer: function(params) {
          return params.toString();
        }
      });
      
      return { 
        data: data.data, 
        isLoadMore: payload.isLoadMore || false,
        offset: payload.params.offset || 0
      };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const getCategoryFilters = createAsyncThunk(
  "catalog/getCategoryFilters",
  async (categoryId: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/filters", {
        params: { categoryId }
      });
      return data.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const getProduct = createAsyncThunk(
  "catalog/getProduct",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/product", {
        params: { productId }
      });
      return data.data.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

export const putFavorite = createAsyncThunk(
  "catalog/putFavorite",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await axdef.put(`/api/Catalog/product/favorite?productId=${productId}`);
      return data.data.data;
    } catch (error: any) {
      console.log('Error in thunk:', error);
      
      // ВАЖНО: Не обрабатываем 401 здесь, просто пробрасываем ошибку
      // Интерсептор сам её перехватит и обработает
      
      // Но если это не 401, то возвращаем rejectWithValue
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      
      // Для 401 - просто пробрасываем ошибку дальше
      throw error; // Это заставит интерсептор сработать
    }
  }
);

export const putUnFavorite = createAsyncThunk(
  "catalog/putUnFavorite",
  async (productId: string, { rejectWithValue }) => {
    try {
      const data = await axdef.put(`/api/Catalog/product/unfavorite?productId=${productId}`);
      return data.data.data;
    } catch (error: any) {
      console.log('Error in thunk:', error);
      
      // ВАЖНО: Не обрабатываем 401 здесь, просто пробрасываем ошибку
      // Интерсептор сам её перехватит и обработает
      
      // Но если это не 401, то возвращаем rejectWithValue
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      
      // Для 401 - просто пробрасываем ошибку дальше
      throw error; // Это заставит интерсептор сработать
    }
  }
);

export const AddToCart = createAsyncThunk(
  "catalog/AddToCart",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.post(`/api/Account/cart`, payload);
      return data.data.data;
    } catch (error: any) {
      console.log('Error in thunk:', error);
    
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
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
  }
);

export const removeMultipleFromCart = createAsyncThunk(
  "catalog/removeMultipleFromCart",
  async (cartItemIds: string[], { rejectWithValue }) => {
    try {
      // Формируем параметры запроса: cartItemIds=kzkzkz&cartItemIds=kzkzk
      const params = new URLSearchParams();
      cartItemIds.forEach(id => {
        params.append('cartItemIds', id);
      });
      
      const response = await axdef.delete(`/api/Account/cart?${params.toString()}`);
      return { cartItemIds, data: response.data };
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);

export const updateCartItemQuantitys = createAsyncThunk(
  "catalog/updateCartItemQuantity",
  async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await axdef.put(`/api/Account/cart/${cartItemId}`, { quantity });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);

export const toggleCartItemFavorite = createAsyncThunk(
  "catalog/toggleCartItemFavorite",
  async ({ cartItemId, productId, isFavorite }: { cartItemId: string; productId: string; isFavorite: boolean }, { rejectWithValue }) => {
    try {
      // Здесь должен быть эндпоинт для избранного в корзине
      // Если такого нет, используй существующий putFavorite
      const response = await axdef.put(`/api/Catalog/product/favorite?productId=${productId}`);
      return { cartItemId, isFavorite: !isFavorite };
    } catch (error: any) {
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
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
  }
);

export const getRecipients = createAsyncThunk(
  "catalog/getRecipients",
  async (deliveryAddressId: string, { rejectWithValue }) => {
    try {
      const response = await axdef.get(`/api/Account/companies/addresses/${deliveryAddressId}/recepients`);
      return response.data.data;
    } catch (error: any) {
      console.log('Error getting recipients:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);
export const createRecipient = createAsyncThunk(
  "catalog/createRecipient",
  async ({ 
    deliveryAddressId, 
    recipientData 
  }: { 
    deliveryAddressId: string; 
    recipientData: {
      fullname: string;
      phoneNumber: string;
      email: string;
    }
  }, { rejectWithValue }) => {
    try {
      const response = await axdef.post(
        `/api/Account/companies/addresses/${deliveryAddressId}/recepients`, 
        recipientData
      );
      return response.data.data;
    } catch (error: any) {
      console.log('Error creating recipient:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);
// Создание получателей
export const createRecipients = createAsyncThunk(
  "catalog/createRecipients",
  async ({ 
    deliveryAddressId, 
    recipients 
  }: { 
    deliveryAddressId: string; 
    recipients: Recipient[] 
  }, { rejectWithValue }) => {
    try {
      const response = await axdef.post(`/api/Account/companies/addresses/${deliveryAddressId}/recepients`, recipients);
      return response.data.data;
    } catch (error: any) {
      console.log('Error creating recipients:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);

export const deleteRecipient = createAsyncThunk(
  "catalog/deleteRecipient",
  async (recipientId: string, { rejectWithValue }) => {
    try {
      await axdef.delete(`/api/Account/companies/addresses/recepients/${recipientId}`);
      return recipientId;
    } catch (error: any) {
      console.log('Error deleting recipient:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);

// Создание заказа
export const createOrder = createAsyncThunk(
  "catalog/createOrder",
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await axdef.post(`/api/Order`, orderData);
      return response.data;
    } catch (error: any) {
      console.log('Error creating order:', error);
      if (error.response?.status !== 401) {
        return rejectWithValue(error);
      }
      throw error;
    }
  }
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    clearProducts: (state) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      state.products = [];
      state.totalCount = 0;
      state.currentPage = 0;
      state.hasMore = true;
      state.selectedFilterIds = [];
      state.selectedSubcategoryId = null;
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
    updateCartItemQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const itemIndex = state.cart.findIndex(item => item.id === cartItemId);
      if (itemIndex !== -1) {
        state.cart[itemIndex].quantity = quantity;
        state.cart[itemIndex].totalPrice = state.cart[itemIndex].price * quantity;
      }
    },
    removeCartItem: (state, action) => {
      const cartItemId = action.payload;
      state.cart = state.cart.filter(item => item.id !== cartItemId);
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
      state.recipients = state.recipients.filter(r => r.id !== action.payload);
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
      if (isLoadMore) {
        state.isLoadingMore = true;
      } else {
        state.isLoading = true;
      }
    });
    
    builder.addCase(getProductList.fulfilled, (state, action) => {
      const { data, isLoadMore, offset } = action.payload;
      const adaptedProducts = adaptProductsArray(data.data || []);
      
      if (isLoadMore && offset > 0) {
        // Для подгрузки добавляем к существующим
        state.products = [...state.products, ...adaptedProducts];
        state.isLoadingMore = false;
        state.currentPage += 1;
      } else {
        // Для первой загрузки или поиска заменяем
        state.products = adaptedProducts;
        state.isLoading = false;
        state.currentPage = 0;
      }
      
      // Проверяем, есть ли еще данные
      const loadedCount = adaptedProducts.length;
      state.hasMore = loadedCount === 10;
      
      console.log('Products loaded:', adaptedProducts.length, 'Total:', state.products.length, 'Has more:', state.hasMore);
    });
    
    builder.addCase(getProductList.rejected, (state, action) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      axiosErrorHandler(action?.payload);
    });
    
    // Обработчики для фильтров
    builder.addCase(getCategoryFilters.pending, (state) => {
      state.isLoadingFilters = true;
    });
    
    builder.addCase(getCategoryFilters.fulfilled, (state, action) => {
      state.filters = action.payload || [];
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
          item => item.productId === cartItem.productId && 
                  item.productPurchaseOptionId === cartItem.productPurchaseOptionId // Важно!
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
    
    builder.addCase(getProduct.pending, (state) => {
      state.isLoadingProduct = true;
    });
    
    builder.addCase(getProduct.fulfilled, (state, action) => {
      console.log('action.payload', action.payload)
      state.product = adaptProductSingleObj(action.payload);
      state.isLoadingProduct = false;
    });
    
    builder.addCase(getProduct.rejected, (state, action) => {
      state.isLoadingProduct = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(putFavorite.pending, (state) => {
    });
    
    builder.addCase(putFavorite.fulfilled, (state, action) => {
      console.log('action.payload', action.payload)
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
    
    builder.addCase(removeMultipleFromCart.fulfilled, (state, action) => {
      const { cartItemIds } = action.payload;
      state.cart = state.cart.filter(item => !cartItemIds.includes(item.id));
    });
    
    builder.addCase(updateCartItemQuantitys.fulfilled, (state, action) => {
      const updatedItem = action.payload;
      const index = state.cart.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        state.cart[index] = updatedItem;
      }
    });
    
    builder.addCase(toggleCartItemFavorite.fulfilled, (state, action) => {
      const { cartItemId, isFavorite } = action.payload;
      const index = state.cart.findIndex(item => item.id === cartItemId);
      if (index !== -1) {
        state.cart[index].isFavorite = isFavorite;
      }
    });

    builder.addCase(getOrderPageData.pending, (state) => {
      state.isLoading = true;
    });
    
    builder.addCase(getOrderPageData.fulfilled, (state, action) => {
      state.isLoading = false;
      state.order = action.payload.data.data
      console.log('Order page data:', action.payload.data);
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

  }
});

export const { 
  clearProducts, 
  resetPagination, 
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
} = catalogSlice.actions;
export default catalogSlice.reducer;