// features/auth/authSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { axiosErrorHandler } from '../shared/services/api';
import { axdef, baseUrl } from '../shared/services/axios';
import { adaptProductsArray } from '../shared/services/productAdapter';

interface CategoryState {
  isLoading: boolean;
  products: any[];
}

const initialState: CategoryState = {

  isLoading: false,
  products: []
};

export const getProductList = createAsyncThunk(
    "user/getProductList",
    async (payload: any, { rejectWithValue }) => {
      try {
        console.log(payload.params) // убрали spread оператор
        const data = await axdef.get("/api/Catalog/product/list", {
          params: payload.params // передаем только params
        });
        return data;
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
    //   state.error = null;
      state.isLoading = false;
      state.products = [];
    },
  },
  extraReducers: (builder) => {

    builder.addCase(getProductList.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getProductList.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log('payloadMe', action.payload.data)
      state.products = adaptProductsArray(action.payload.data.data)

    //   state.products = action.payload.data.data.map((item: any) => ({
    //     ...item, 
    //     // imageUrl: `${baseUrl}/${item.imageUrl}` 
    //   }));
    });
    builder.addCase(getProductList.rejected, (state, action) => {
      state.isLoading = false;
      // console.log('action.payload.reject', JSON.stringify(action?.payload))
      axiosErrorHandler(action?.payload);

    });

  }
});

export const { clearProducts } = catalogSlice.actions;
export default catalogSlice.reducer;