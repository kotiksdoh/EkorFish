// features/auth/authSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { axiosErrorHandler } from '../shared/services/api';
import { axdef } from '../shared/services/axios';
import { adaptProductsArray } from '../shared/services/productAdapter';

interface CategoryState {
  isLoading: boolean;
  isLoadingMore: boolean;
  products: any[];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
}

const initialState: CategoryState = {
  isLoading: false,
  isLoadingMore: false,
  products: [],
  totalCount: 0,
  currentPage: 0,
  hasMore: true,
};

export const getProductList = createAsyncThunk(
  "user/getProductList",
  async (payload: { params: any, isLoadMore?: boolean }, { rejectWithValue }) => {
    try {
      console.log('API call params:', payload.params);
      const data = await axdef.get("/api/Catalog/product/list", {
        params: payload.params
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
    },
    resetPagination: (state) => {
      state.products = [];
      state.currentPage = 0;
      state.hasMore = true;
      state.totalCount = 0;
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
      state.hasMore = loadedCount === 10; // Предполагаем, что если пришло 10 товаров, есть еще
      
      console.log('Products loaded:', adaptedProducts.length, 'Total:', state.products.length, 'Has more:', state.hasMore);
    });
    
    builder.addCase(getProductList.rejected, (state, action) => {
      state.isLoading = false;
      state.isLoadingMore = false;
      axiosErrorHandler(action?.payload);
    });
  }
});

export const { clearProducts, resetPagination } = catalogSlice.actions;
export default catalogSlice.reducer;