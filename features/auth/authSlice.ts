// features/auth/authSlice.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api, { axiosErrorHandler } from "../shared/services/api";
import { axdef, baseUrl } from "../shared/services/axios";
import { getCart, getMyOrders } from "../catalog/catalogSlice";
import { getInlineParams } from "../shared/services/utils";
import type { AppDispatch } from "@/store/store";

interface AuthState {
  user: any | null;
  error: string | null;
  isLoading: boolean;
  phoneNumber: string | null;
  company: any;
  me: any;
  params: any[];
  sliders: any[];
  categories: any[];
  searchHints: string[];
  predUserData: any;
  towns: Town[];
  isLoadingTowns: boolean;
  currentCompany: any;

  bonusHistory: any[];
  isLoadingBonus: boolean;
  hasMoreBonus: boolean;
  currentBonusPage: number;

  managers: any[];
  onceManager: any;
  isLoadingManager: boolean;
  isLoadingManagerReviewOption: boolean;
  reviewOptions: any[];

  payments: {
    id: string;
    amount: number;
    date: string;
    paymentType: string;
    invoiceNumber: string;
    invoiceDate: string;
    processed: boolean;
    companyName: string;
  }[];
  paymentsFillter: {
    id: string;
    name: string;
    paramName: string;
    filterOptions: {
      code: string;
      id: string;
      value: string;
    }[];
  }[];
  isLoadingPayments: boolean;

  helpList: {
    type: string;
    items: {
      title: string;
      htmlText: string;
    }[];
  }[];
  isLoadingHelp: boolean;
  pushSettings: {
    pushNotificationType: number;
    name: string;
    isEnabled: boolean;
  }[];
  isLoadingPushSettings: boolean;
  isUpdatingPushPreference: boolean;
  pushes: {
    title: string;
    body: string;
    sentAt: string;
  }[];
  uncheckedPushesCount: number;
  isLoadingPushes: boolean;
  hasMorePushes: boolean;
  bootstrapStatus: "idle" | "loading" | "ready" | "failed";
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
  params: [],
  sliders: [],
  categories: [],
  searchHints: [],
  predUserData: null,
  towns: [],
  isLoadingTowns: false,
  currentCompany: null as any,

  bonusHistory: [],
  isLoadingBonus: false,
  hasMoreBonus: true,
  currentBonusPage: 0,
  managers: [],
  onceManager: null,
  isLoadingManager: false,
  isLoadingManagerReviewOption: false,
  reviewOptions: [],

  payments: [],
  paymentsFillter: [],
  isLoadingPayments: false,

  helpList: [],
  isLoadingHelp: false,
  pushSettings: [],
  isLoadingPushSettings: false,
  isUpdatingPushPreference: false,
  pushes: [],
  uncheckedPushesCount: 0,
  isLoadingPushes: false,
  hasMorePushes: true,
  bootstrapStatus: "idle",
};

interface UpdatePushPreferencePayload {
  pushNotificationType: number;
  isEnabled: boolean;
}

interface GetPushesPayload {
  count: number;
  offset: number;
  isLoadMore?: boolean;
  check?: boolean;
}

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

export const getMyParams = createAsyncThunk(
  "user/getMyParams",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/AdditionalInformation/params");
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

export const getSearchHints = createAsyncThunk(
  "user/getSearchHints",
  async (_, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Catalog/search-hints");
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

export const getBonusHistory = createAsyncThunk(
  "user/getBonusHistory",
  async (params: { offset: number; count: number }, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/Account/bonus/list", {
        params: {
          offset: params.offset,
          count: params.count,
        },
      });
      return {
        data: data.data,
        offset: params.offset,
        count: params.count,
      };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getMangers = createAsyncThunk(
  "user/managers",
  async (_, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/AdditionalInformation/managers");
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getManagerReviewOptions = createAsyncThunk(
  "user/getManagerReviewOptions",
  async (_, { rejectWithValue }) => {
    try {
      const data = await axdef.get(
        "/api/AdditionalInformation/manager/review-options",
      );
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const createReview = createAsyncThunk(
  "user/createReview",
  async (payload: any, { rejectWithValue }) => {
    try {
      const data = await axdef.post(
        "/api/AdditionalInformation/manager/reviews",
        payload,
      );
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getUserPaymentsThunk = createAsyncThunk(
  "user/getUserPaymentsThunk",
  async (
    payload: {
      companyId?: string;
      processed?: boolean;
      paymentType?: number;
      paymentDateMonth?: string;
      paymentDateYear?: string;
      invoiceDateMonth?: string;
      InvoiceDateYear?: string;
      count?: number;
      offSet?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload || {}).filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        ),
      );
      const queryString = new URLSearchParams(cleanedPayload as any).toString();
      const data = await axdef.get(`/api/PaymentHistory/list?${queryString}`);
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getUserPaymentsFilterThunk = createAsyncThunk(
  "user/getUserPaymentsFilterThunk",
  async (
    payload: {
      companyId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload || {}).filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        ),
      );
      const queryString = new URLSearchParams(cleanedPayload as any).toString();
      const filterData = await axdef.get(
        `/api/PaymentHistory/filters${queryString ? `?${queryString}` : ""}`,
      );
      return filterData;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const postReconciliationActThunk = createAsyncThunk(
  "user/postReconciliationActThunk",
  async (
    payload: {
      dateFrom: string;
      dateTo: string;
      companyId?: string;
      comment: string;
      email: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const queryString = new URLSearchParams(payload as any).toString();
      const filterData = await axdef.get(
        `/api/PaymentHistory/reconciliation-act?${queryString}`,
      );
      return filterData;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const postPriceListThunk = createAsyncThunk(
  "user/postPriceListThunk",
  async (
    payload: {
      companyId?: string;
      email: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const queryString = new URLSearchParams(payload as any).toString();
      const filterData = await axdef.get(
        `/api/PaymentHistory/price-list?${queryString}`,
      );
      return filterData;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getHeplListThunk = createAsyncThunk(
  "user/getHeplListThunk",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axdef.get(`/api/AdditionalInformation/help`);
      return res;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getPushSettings = createAsyncThunk(
  "user/getPushSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axdef.get("/api/AdditionalInformation/push/settings");
      return res;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const updatePushPreference = createAsyncThunk(
  "user/updatePushPreference",
  async (payload: UpdatePushPreferencePayload, { rejectWithValue }) => {
    try {
      const res = await axdef.put("/api/Account/push/preferences", payload);
      return { response: res, payload };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getPushesThunk = createAsyncThunk(
  "user/getPushesThunk",
  async (payload: GetPushesPayload, { rejectWithValue }) => {
    try {
      const data = await axdef.get("/api/AdditionalInformation/pushes", {
        params: {
          count: payload.count,
          offset: payload.offset,
          check: payload.check,
        },
      });
      return { data, payload };
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

export const getUncheckedPushesCountThunk = createAsyncThunk(
  "user/getUncheckedPushesCountThunk",
  async (_, { rejectWithValue }) => {
    try {
      const data = await axdef.get(
        "/api/AdditionalInformation/pushes/unchecked-count",
      );
      return data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error);
    }
  },
);

const INIT_REQUEST_TIMEOUT_MS = 12000;

async function withBootstrapTimeout<T>(
  promise: Promise<T>,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`[Bootstrap] Timeout while loading ${label}`)),
        INIT_REQUEST_TIMEOUT_MS,
      ),
    ),
  ]);
}

async function loadAppBootstrapData(
  dispatch: AppDispatch,
  options?: { skipTimeout?: boolean },
): Promise<boolean> {
  const useTimeout = options?.skipTimeout !== true;

  const runStep = <T>(promise: Promise<T>, label: string): Promise<T> =>
    useTimeout ? withBootstrapTimeout(promise, label) : promise;

  const token = await AsyncStorage.getItem("token");

  const criticalSteps: Promise<unknown>[] = [
    runStep(dispatch(getCategoryItems("")).unwrap(), "categories"),
    runStep(dispatch(getSliderItems("")).unwrap(), "sliders"),
  ];

  const optionalSteps: Promise<unknown>[] = [
    runStep(dispatch(getSearchHints()).unwrap(), "search-hints"),
  ];

  const authSteps: Promise<unknown>[] = token
    ? [
        runStep(dispatch(getMyInfo("")).unwrap(), "my-info"),
        runStep(dispatch(getMyParams("")).unwrap(), "params"),
        runStep(dispatch(getCart()).unwrap(), "cart"),
        runStep(dispatch(getMyOrders()).unwrap(), "orders"),
      ]
    : [];

  const criticalResults = await Promise.allSettled(criticalSteps);
  await Promise.allSettled([...authSteps, ...optionalSteps]);

  return criticalResults.every((result) => result.status === "fulfilled");
}

export const runAppBootstrap = createAsyncThunk(
  "auth/runAppBootstrap",
  async (
    payload: { skipTimeout?: boolean } | undefined,
    { dispatch, rejectWithValue },
  ) => {
    try {
      const success = await loadAppBootstrapData(dispatch, payload);
      if (!success) {
        return rejectWithValue("bootstrap_failed");
      }
      return true;
    } catch (error) {
      return rejectWithValue(error);
    }
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
    clearBonusHistory: (state) => {
      state.bonusHistory = [];
      state.hasMoreBonus = true;
      state.currentBonusPage = 0;
    },
    setBootstrapStatus: (
      state,
      action: PayloadAction<AuthState["bootstrapStatus"]>,
    ) => {
      state.bootstrapStatus = action.payload;
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
    builder.addCase(getSearchHints.fulfilled, (state, action) => {
      const hints = action.payload?.data?.data;
      state.searchHints = Array.isArray(hints) ? hints : [];
    });
    builder.addCase(getSearchHints.rejected, (state, action) => {
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
        imageUrl: item.imageUrl
          ? `${baseUrl}/${String(item.imageUrl).replace(/^\//, "")}`
          : undefined,
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
          manager: responseData.individualProfile?.manager,
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

    builder.addCase(getMyParams.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getMyParams.fulfilled, (state, action) => {
      state.isLoading = false;
      console.log("params", action.payload);
      state.params = action.payload.data.data;
    });
    builder.addCase(getMyParams.rejected, (state, action) => {
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
      state.isLoading = false;
      console.log("action", action.payload);
      if (
        action?.payload?.data?.data?.tokens?.accessToken &&
        action?.payload.data?.data?.tokens?.refreshToken
      ) {
        // Используем async/await
        console.log("action.payload?.data", action.payload?.data);
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

    builder.addCase(getMangers.pending, (state) => {
      state.isLoadingManager = true;
      state.error = null;
    });

    builder.addCase(getMangers.fulfilled, (state, action) => {
      state.isLoadingManager = false;
      state.managers = action.payload.data.data || [];
      console.log("Towns loaded:", state.towns);
    });

    builder.addCase(getMangers.rejected, (state, action) => {
      state.isLoadingManager = false;
      state.error = "Ошибка загрузки менеджеров";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getManagerReviewOptions.pending, (state) => {
      state.isLoadingManagerReviewOption = true;
      state.error = null;
    });

    builder.addCase(getManagerReviewOptions.fulfilled, (state, action) => {
      state.isLoadingManagerReviewOption = false;
      state.reviewOptions = action.payload.data.data || [];
      console.log("Towns loaded:", state.towns);
    });

    builder.addCase(getManagerReviewOptions.rejected, (state, action) => {
      state.isLoadingManagerReviewOption = false;
      state.error = "Ошибка загрузки опций";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(createReview.pending, (state) => {
      state.isLoadingManagerReviewOption = true;
      state.error = null;
    });

    builder.addCase(createReview.fulfilled, (state, action) => {
      state.isLoadingManagerReviewOption = false;
      console.log("Towns loaded:", state.towns);
    });

    builder.addCase(createReview.rejected, (state, action) => {
      state.isLoadingManagerReviewOption = false;
      state.error = "Ошибка загрузки отзыва";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getUserPaymentsThunk.pending, (state) => {
      state.isLoadingPayments = true;
      state.error = null;
    });

    builder.addCase(getUserPaymentsThunk.fulfilled, (state, action) => {
      state.isLoadingPayments = false;
      const nextPayments = action.payload.data.data || [];
      const isLoadMore = !!(
        action.meta?.arg?.offSet &&
        Number(action.meta.arg.offSet) > 0
      );

      if (isLoadMore) {
        const existingIds = new Set((state.payments || []).map((item: any) => item.id));
        const uniqueNext = nextPayments.filter((item: any) => !existingIds.has(item.id));
        state.payments = [...state.payments, ...uniqueNext];
      } else {
        state.payments = nextPayments;
      }
      console.log("Payments LOaded:", state.payments);
    });

    builder.addCase(getUserPaymentsFilterThunk.pending, (state) => {
      state.isLoadingPayments = true;
      state.error = null;
    });

    builder.addCase(getUserPaymentsFilterThunk.fulfilled, (state, action) => {
      state.isLoadingPayments = false;
      state.paymentsFillter = action.payload.data.data;
      console.log("Payments LOaded:", state.payments);
    });

    builder.addCase(getUserPaymentsFilterThunk.rejected, (state, action) => {
      state.isLoadingPayments = false;
      state.error = "Ошибка загрузки фильтров";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(postReconciliationActThunk.pending, (state) => {
      state.isLoadingPayments = true;
      state.error = null;
    });

    builder.addCase(postReconciliationActThunk.fulfilled, (state, action) => {
      state.isLoadingPayments = false;
      console.log("Payments LOaded:", state.payments);
    });

    builder.addCase(postReconciliationActThunk.rejected, (state, action) => {
      state.isLoadingPayments = false;
      state.error = "Ошибка отправки";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(postPriceListThunk.pending, (state) => {
      state.isLoadingPayments = true;
      state.error = null;
    });

    builder.addCase(postPriceListThunk.fulfilled, (state, action) => {
      state.isLoadingPayments = false;
      console.log("Payments LOaded:", state.payments);
    });

    builder.addCase(postPriceListThunk.rejected, (state, action) => {
      state.isLoadingPayments = false;
      state.error = "Ошибка отправки";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getHeplListThunk.pending, (state) => {
      state.isLoadingHelp = true;
      state.error = null;
    });

    builder.addCase(getHeplListThunk.fulfilled, (state, action) => {
      state.isLoadingHelp = false;
      state.helpList = action.payload.data.data;
    });

    builder.addCase(getHeplListThunk.rejected, (state, action) => {
      state.isLoadingHelp = false;
      state.error = "Ошибка отправки";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getPushSettings.pending, (state) => {
      state.isLoadingPushSettings = true;
      state.error = null;
    });

    builder.addCase(getPushSettings.fulfilled, (state, action) => {
      state.isLoadingPushSettings = false;
      state.pushSettings = action.payload?.data?.data || [];
    });

    builder.addCase(getPushSettings.rejected, (state, action) => {
      state.isLoadingPushSettings = false;
      state.error = "Ошибка загрузки настроек уведомлений";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(updatePushPreference.pending, (state) => {
      state.isUpdatingPushPreference = true;
      state.error = null;
    });

    builder.addCase(updatePushPreference.fulfilled, (state, action) => {
      state.isUpdatingPushPreference = false;
      const { pushNotificationType, isEnabled } = action.payload.payload;
      state.pushSettings = state.pushSettings.map((item) =>
        item.pushNotificationType === pushNotificationType
          ? { ...item, isEnabled }
          : item,
      );
    });

    builder.addCase(updatePushPreference.rejected, (state, action) => {
      state.isUpdatingPushPreference = false;
      state.error = "Ошибка обновления настроек уведомлений";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getPushesThunk.pending, (state, action) => {
      if (!action.meta.arg?.isLoadMore) {
        state.isLoadingPushes = true;
      }
      state.error = null;
    });

    builder.addCase(getPushesThunk.fulfilled, (state, action) => {
      state.isLoadingPushes = false;
      const nextItems = action.payload?.data?.data?.data || [];
      const { isLoadMore, count } = action.payload.payload;

      if (isLoadMore) {
        state.pushes = [...state.pushes, ...nextItems];
      } else {
        state.pushes = nextItems;
      }

      state.hasMorePushes = nextItems.length === count;
    });

    builder.addCase(getPushesThunk.rejected, (state, action) => {
      state.isLoadingPushes = false;
      state.error = "Ошибка загрузки уведомлений";
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(getUncheckedPushesCountThunk.fulfilled, (state, action) => {
      const rawCount = action.payload?.data?.data;
      state.uncheckedPushesCount =
        typeof rawCount === "number"
          ? rawCount
          : Number.parseInt(String(rawCount ?? 0), 10) || 0;
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

    builder.addCase(getBonusHistory.pending, (state, action) => {
      state.isLoadingBonus = true;
      // Если это первая загрузка (offset = 0), можно показать индикатор загрузки
      // Но историю не очищаем, чтобы не было пустого экрана при подгрузке
    });

    builder.addCase(getBonusHistory.fulfilled, (state, action) => {
      state.isLoadingBonus = false;

      // Получаем данные из ответа
      // Предполагаем, что API возвращает массив в data.data
      const responseData = action.payload.data?.data || [];
      const newItems = responseData;
      const offset = action.payload.offset;

      console.log(`Loaded ${newItems.length} items at offset ${offset}`);

      if (offset === 0) {
        // При первой загрузке или обновлении - заменяем историю
        state.bonusHistory = newItems;
        state.currentBonusPage = 0;
      } else {
        // При подгрузке - добавляем к существующей
        state.bonusHistory = [...state.bonusHistory, ...newItems];
        state.currentBonusPage += 1;
      }

      // Проверяем, есть ли еще данные
      // Если получили меньше элементов, чем запрашивали, значит данных больше нет
      const pageSize = action.payload.count || 10;
      state.hasMoreBonus = newItems.length === pageSize;

      console.log("Bonus history updated:", {
        total: state.bonusHistory.length,
        hasMore: state.hasMoreBonus,
        currentPage: state.currentBonusPage,
      });
    });

    builder.addCase(getBonusHistory.rejected, (state, action) => {
      state.isLoadingBonus = false;
      state.hasMoreBonus = false;
      axiosErrorHandler(action?.payload);
    });

    builder.addCase(runAppBootstrap.pending, (state) => {
      state.bootstrapStatus = "loading";
    });
    builder.addCase(runAppBootstrap.fulfilled, (state) => {
      state.bootstrapStatus = "ready";
    });
    builder.addCase(runAppBootstrap.rejected, (state) => {
      state.bootstrapStatus = "failed";
    });
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
  clearBonusHistory,
  setBootstrapStatus,
} = authSlice.actions;
export default authSlice.reducer;
