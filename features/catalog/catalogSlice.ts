// features/catalog/catalogSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { axiosErrorHandler } from '../shared/services/api';
import { axdef } from '../shared/services/axios';
import { adaptProductsArray } from '../shared/services/productAdapter';

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
  isLoadingFilters: boolean; // Добавляем состояние загрузки фильтров
  products: any[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  filters: CategoryFilter[]; // Добавляем фильтры
  selectedFilterIds: string[]; // Выбранные ID фильтров
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
};

export const getProductList = createAsyncThunk(
  "user/getProductList",
  async (payload: { params: any, isLoadMore?: boolean }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { catalog: CategoryState };
      const { selectedFilterIds } = state.catalog;
      
      // Создаем параметры вручную
      const queryParams = new URLSearchParams();
      
      // Базовые параметры
      const baseParams = {
        ...payload.params,
        isFavorite: false
      };
      
      // Добавляем все параметры кроме фильтров
      Object.keys(baseParams).forEach(key => {
        const value = baseParams[key];
        if (value !== null && value !== undefined && key !== 'ProductFilterIds') {
          if (Array.isArray(value)) {
            value.forEach(item => queryParams.append(key, item));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      
      // Добавляем фильтры в правильном формате
      if (selectedFilterIds.length > 0) {
        selectedFilterIds.forEach(filterId => {
          queryParams.append('ProductFilterIds', filterId);
        });
      }
      
      const url = `/api/Catalog/product/list?${queryParams.toString()}`;
      console.log('Request URL:', url);
      
      const data = await axdef.get(url);
      
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

// Новый thunk для получения фильтров
export const getCategoryFilters = createAsyncThunk(
  "catalog/getCategoryFilters",
  async (categoryId: string, { rejectWithValue }) => {
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
    },
    resetPagination: (state) => {
      state.products = [];
      state.currentPage = 0;
      state.hasMore = true;
      state.totalCount = 0;
      state.selectedFilterIds = [];
    },
    // Действия для управления фильтрами
    toggleFilterSelection: (state, action) => {
      const filterId = action.payload;
      const index = state.selectedFilterIds.indexOf(filterId);
      
      if (index === -1) {
        // Добавляем фильтр
        state.selectedFilterIds.push(filterId);
      } else {
        // Удаляем фильтр
        state.selectedFilterIds.splice(index, 1);
      }
    },
    clearSelectedFilters: (state) => {
      state.selectedFilterIds = [];
    },
    setSelectedFilters: (state, action) => {
      state.selectedFilterIds = action.payload;
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
  }
});

export const { 
  clearProducts, 
  resetPagination, 
  toggleFilterSelection, 
  clearSelectedFilters,
  setSelectedFilters 
} = catalogSlice.actions;
export default catalogSlice.reducer;