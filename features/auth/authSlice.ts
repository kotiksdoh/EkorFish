// features/auth/authSlice.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api, { axiosErrorHandler } from "../shared/services/api";
import { axdef, baseUrl } from "../shared/services/axios";
import { getInlineParams } from "../shared/services/utils";

interface AuthState {
  user: any | null;
  error: string | null;
  isLoading: boolean;
  phoneNumber: string | null;
  company: any;
  me: any;
  sliders: any[];
  categories: any[];
  predUserData: any;
  towns: Town[];
  isLoadingTowns: boolean;
  currentCompany: any;
}
interface Town {
  id: string;
  value: string;
}

interface UpdateTownPayload {
  storageId: string | null;
}

const initialState: AuthState = {
  user: null,
  error: null,
  isLoading: false,
  phoneNumber: null,
  company: null,
  me: null,
  sliders: [],
  categories: [],
  predUserData: null,
  towns: [],
  isLoadingTowns: false,
  currentCompany: null as any,
};

export const getCode = createAsyncThunk(
  "user/getCode",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await api.admin.post(
        "/api/Account/send-verification-code",
        payload,
      );
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const sendCode = createAsyncThunk(
  "user/sendCode",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await api.admin.post("/api/Account/verify-code", payload);
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const compliteProfile = createAsyncThunk(
  "user/compliteProfile",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.post("/api/Account/complete-profile", payload);
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const compliteCompany = createAsyncThunk(
  "user/compliteCompany",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.post("/api/Account/companies", payload);
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const searchCompany = createAsyncThunk(
  "user/searchCompany",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get(
        "/api/Account/companies?" + getInlineParams(payload),
      );
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getMyInfo = createAsyncThunk(
  "user/getMyInfo",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Account/my-info");
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getSliderItems = createAsyncThunk(
  "user/getSliderItems",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/AdditionalInformation/banners");
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getCategoryItems = createAsyncThunk(
  "user/getCategoryItems",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/categories");
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getTowns = createAsyncThunk(
  "user/getTowns",
  async (_, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/towns");
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const updateUserTown = createAsyncThunk(
  "user/updateTown",
  async (payload: UpdateTownPayload, { rejectWithValue }) => {
    try {
      const data = await axdef.put(`/api/Account/town/${payload.storageId}`);
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const loadCompanyFromStorage = createAsyncThunk(
  "company/loadFromStorage",
  async () => {
    const companyData = await AsyncStorage.getItem("company");
    return companyData ? JSON.parse(companyData) : null;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      return initialState;
    },
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
    setCompany: (state, action) => {
      state.currentCompany = action.payload;
      (async () => {
        try {
          await AsyncStorage.setItem("company", JSON.stringify(action.payload));
          console.log("Company saved to AsyncStorage");
        } catch (error) {
          console.error("Error saving company:", error);
        }
      })();
    },
    selectCompany: (state, action) => {
      state.currentCompany = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(searchCompany.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(searchCompany.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log("payloadComp", action.payload.data.data);
      state.company = action.payload.data.data;
    });
    builder.addCase(searchCompany.rejected, (state, action) => {
      state.isLoading = false;
      console.log("action.payload.reject", JSON.stringify(action?.payload));
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getSliderItems.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getSliderItems.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log("payloadComp", action.payload.data.data);
      const stringArray = action.payload.data.data;
      state.sliders = stringArray.map((imgUrl: any, index: any) => ({
        id: index + 1,
        imageUrl: `${baseUrl}/${imgUrl}`,
      }));
      console.log("sliders", state.sliders);
    });
    builder.addCase(getSliderItems.rejected, (state, action) => {
      state.isLoading = false;
      // console.log('action.payload.reject', JSON.stringify(action?.payload))
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(getCategoryItems.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCategoryItems.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log("payloadMe", action.payload.data);
      state.categories = action.payload.data.data;
      state.categories = action.payload.data.data.map((item: any) => ({
        ...item,
        imageUrl: `${baseUrl}/${item.imageUrl}`,
      }));
    });
    builder.addCase(getCategoryItems.rejected, (state, action) => {
      state.isLoading = false;
      // console.log('action.payload.reject', JSON.stringify(action?.payload))
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getMyInfo.pending, (state) => {
      state.isLoading = true;
    });
    // builder.addCase(getMyInfo.fulfilled, (state, action) => {
    //   state.isLoading = false;
    //   console.log('payloadMe', action.payload.data)
    //   state.me = action.payload.data.data;
    //   // (async () => {
    //   //   try {
    //   //     await AsyncStorage.setItem("me", action.payload.data.data);
    //   //     console.log('me saved to AsyncStorage');
    //   //   } catch (error) {
    //   //     console.error('Error saving me:', error);
    //   //   }
    //   // })();
    // });
    builder.addCase(getMyInfo.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log("payloadMe", action.payload.data);

      const responseData = action.payload.data.data;
      state.me = responseData;

      // Преобразуем individualProfile в формат компании и добавляем в companies
      if (responseData.individualProfile) {
        const individualAsCompany = {
          id: responseData.individualProfile.id,
          name: `${responseData.individualProfile.lastName} ${responseData.individualProfile.firstName} ${responseData.individualProfile.patronymic || ""}`.trim(),
          inn: "", // ИНН может отсутствовать для физлица
          foundationDate: responseData.individualProfile.birthDate,
          kpp: "", // КПП нет для физлица
          legalAddress: "", // Адрес может быть в доставке
          contactPerson:
            `${responseData.individualProfile.lastName} ${responseData.individualProfile.firstName} ${responseData.individualProfile.patronymic || ""}`.trim(),
          deliveryAddresses:
            responseData.individualProfile.deliveryAddresses || [],
          type: "individual" as const, // Добавляем флаг типа
        };

        state.me.companies = [
          individualAsCompany,
          ...(responseData.companies || []),
        ];
      }
    });
    builder.addCase(getMyInfo.rejected, (state, action) => {
      state.isLoading = false;
      // console.log('action.payload.reject', JSON.stringify(action?.payload))
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(compliteProfile.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(compliteProfile.fulfilled, (state, action) => {
      state.isLoading = false;
    });
    builder.addCase(compliteProfile.rejected, (state, action) => {
      state.isLoading = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(compliteCompany.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(compliteCompany.fulfilled, (state, action) => {
      console.log(" action.payload?", action.payload);
      state.isLoading = false;
      (async () => {
        try {
          await AsyncStorage.setItem(
            "company",
            JSON.stringify(action.payload?.data?.data),
          );
          console.log("Tokens saved to AsyncStorage");
        } catch (error) {
          console.error("Error saving tokens:", error);
        }
      })();
    });
    builder.addCase(compliteCompany.rejected, (state, action) => {
      state.isLoading = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getCode.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCode.fulfilled, (state, action) => {
      state.isLoading = false;
    });
    builder.addCase(getCode.rejected, (state, action) => {
      state.isLoading = false;
      console.log("action");
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(sendCode.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(sendCode.fulfilled, (state, action) => {
      debugger;
      state.isLoading = false;
      console.log("action", action.payload);
      debugger;
      if (
        action?.payload?.data?.data?.tokens?.accessToken &&
        action?.payload.data?.data?.tokens?.refreshToken
      ) {
        // Используем async/await
        console.log("action.payload?.data", action.payload?.data);
        debugger;
        state.predUserData = action.payload?.data?.data;
        (async () => {
          try {
            await AsyncStorage.setItem(
              "token",
              action.payload?.data?.data?.tokens?.accessToken,
            );
            await AsyncStorage.setItem(
              "token_refresh",
              action.payload.data?.data?.tokens?.refreshToken,
            );
            console.log("Tokens saved to AsyncStorage");
          } catch (error) {
            console.error("Error saving tokens:", error);
          }
        })();
      }
    });
    builder.addCase(sendCode.rejected, (state, action) => {
      state.isLoading = false;
      console.log("action");
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(getTowns.pending, (state) => {
      state.isLoadingTowns = true;
      state.error = null;
    });

    builder.addCase(getTowns.fulfilled, (state, action) => {
      state.isLoadingTowns = false;
      state.towns = action.payload.data.data || [];
      console.log("Towns loaded:", state.towns);
    });

    builder.addCase(getTowns.rejected, (state, action) => {
      state.isLoadingTowns = false;
      state.error = "Ошибка загрузки городов";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(updateUserTown.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(updateUserTown.fulfilled, (state, action) => {
      state.isLoading = false;
      if (state.me) {
        state.me.storageId = action.meta.arg.storageId;
        // state.me.townId = action.meta.arg.townId;
      }
      console.log("Town updated successfully");
    });

    builder.addCase(updateUserTown.rejected, (state, action) => {
      state.isLoading = false;
      axiosErrorHandler(action?.payload);
    });
    builder.addCase(loadCompanyFromStorage.pending, (state) => {});
    builder.addCase(loadCompanyFromStorage.fulfilled, (state, action) => {
      state.currentCompany = action.payload;
    });
    builder.addCase(loadCompanyFromStorage.rejected, (state) => {});
  },
});

export const {
  setAuthError,
  setAuthLoading,
  setPhoneNumber,
  clearAuth,
  selectCompany,
  setCompany,
  clearAuthState,
} = authSlice.actions;
export default authSlice.reducer;
