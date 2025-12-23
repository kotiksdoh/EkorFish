// features/auth/authSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api, { axiosErrorHandler } from '../shared/services/api';

interface AuthState {
  user: any | null
  error: string | null;
  isLoading: boolean;
  phoneNumber: string | null;
}

const initialState: AuthState = {
  user: null,
  error: null,
  isLoading: false,
  phoneNumber: null,
};

export const getCode = createAsyncThunk(
  "user/login",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await api.admin.post("/api/Account/send-verification-code", payload);
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPhoneNumber: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
    clearAuth: (state) => {
      state.error = null;
      state.isLoading = false;
      state.phoneNumber = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getCode.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCode.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log('action', action.payload)
      if (action.payload?.data?.data?.access && action.payload.data?.data?.refresh) {
        localStorage.setItem("token", action.payload?.data?.data?.access);
        localStorage.setItem(
          "token_refresh",
          action.payload?.data?.data?.refresh
        );
      }
    });
    builder.addCase(getCode.rejected, (state, action) => {
      state.isLoading = false;
      console.log('action')
      axiosErrorHandler(action?.payload);

    });
  }
});

export const { setAuthError, setAuthLoading, setPhoneNumber, clearAuth } = authSlice.actions;
export default authSlice.reducer;