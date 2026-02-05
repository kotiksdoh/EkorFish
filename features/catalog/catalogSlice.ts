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

  cart: any
  isLoadingCart: boolean;
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

  cart: null,
  isLoadingCart: false,
};

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
  },
  extraReducers: (builder) => {
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
      state.cart = action.payload.data;
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
    
  }
});

export const { 
  clearProducts, 
  resetPagination, 
  toggleFilterSelection, 
  clearSelectedFilters,
  setSelectedFilters,
  setSelectedSubcategory,
  clearSelectedSubcategory
} = catalogSlice.actions;
export default catalogSlice.reducer;