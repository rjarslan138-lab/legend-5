import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { logoutUser, setCredentials } from '../slices/authSlice';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
});

// Custom baseQuery with automatic token refresh on 401
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Attempt refresh token call if not already an auth endpoint
    const url = typeof args === 'string' ? args : args.url;
    if (!url.includes('/auth/login') && !url.includes('/auth/register') && !url.includes('/auth/refresh')) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = (refreshResult.data as any).data;
        if (data?.user) {
          api.dispatch(setCredentials({ user: data.user }));
        }
        // Retry the original query
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logoutUser());
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Inventory',
    'Product',
    'Stock',
    'Order',
    'Customer',
    'Dashboard',
    'User',
    'Warehouse',
  ],
  endpoints: (builder) => ({
    // --- Auth Endpoints ---
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // --- Users (Owner only) ---
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // --- Warehouses & Locations ---
    getWarehouses: builder.query({
      query: () => '/warehouses',
      providesTags: ['Warehouse'],
    }),
    createWarehouse: builder.mutation({
      query: (body) => ({
        url: '/warehouses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    createLocation: builder.mutation({
      query: ({ warehouseId, ...body }) => ({
        url: `/warehouses/${warehouseId}/locations`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Warehouse', 'Stock'],
    }),

    // --- Fabric Inventory ---
    getFabricBatches: builder.query({
      query: (params) => ({
        url: '/inventory',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    getFabricBatch: builder.query({
      query: (id) => `/inventory/${id}`,
      providesTags: ['Inventory'],
    }),
    createFabricBatch: builder.mutation({
      query: (body) => ({
        url: '/inventory',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory', 'Dashboard'],
    }),
    updateFabricBatch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/inventory/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Inventory', 'Dashboard'],
    }),
    deleteFabricBatch: builder.mutation({
      query: (id) => ({
        url: `/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory', 'Dashboard'],
    }),

    // --- Products & Variants ---
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    createVariant: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/variants`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Stock', 'Dashboard'],
    }),

    // --- Stock Movements ---
    getStock: builder.query({
      query: (params) => ({
        url: '/stock',
        params,
      }),
      providesTags: ['Stock'],
    }),
    getStockMovements: builder.query({
      query: (params) => ({
        url: '/stock/movements',
        params,
      }),
      providesTags: ['Stock'],
    }),
    receiveStock: builder.mutation({
      query: (body) => ({
        url: '/stock/receive',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'Product', 'Dashboard', 'Warehouse'],
    }),
    transferStock: builder.mutation({
      query: (body) => ({
        url: '/stock/transfer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'Product', 'Warehouse'],
    }),
    adjustStock: builder.mutation({
      query: (body) => ({
        url: '/stock/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'Product', 'Dashboard'],
    }),
    recordDamagedStock: builder.mutation({
      query: (body) => ({
        url: '/stock/damaged',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'Product', 'Dashboard'],
    }),

    // --- Customers ---
    getCustomers: builder.query({
      query: (params) => ({
        url: '/customers',
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: ['Customer'],
    }),
    createCustomer: builder.mutation({
      query: (body) => ({
        url: '/customers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Customer', 'Dashboard'],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),

    // --- Orders & Payments ---
    getOrders: builder.query({
      query: (params) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Dashboard', 'Customer'],
    }),
    confirmOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: ['Order', 'Stock', 'Product', 'Dashboard', 'Customer'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Order', 'Dashboard'],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Order', 'Stock', 'Product', 'Dashboard', 'Customer'],
    }),
    recordPayment: builder.mutation({
      query: ({ orderId, ...body }) => ({
        url: `/orders/${orderId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'Customer', 'Dashboard'],
    }),

    // --- Traceability ---
    traceSku: builder.query({
      query: (sku) => `/trace/sku/${sku}`,
    }),

    // --- Dashboard ---
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useCreateLocationMutation,
  useGetFabricBatchesQuery,
  useGetFabricBatchQuery,
  useCreateFabricBatchMutation,
  useUpdateFabricBatchMutation,
  useDeleteFabricBatchMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateVariantMutation,
  useGetStockQuery,
  useGetStockMovementsQuery,
  useReceiveStockMutation,
  useTransferStockMutation,
  useAdjustStockMutation,
  useRecordDamagedStockMutation,
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useConfirmOrderMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useRecordPaymentMutation,
  useLazyTraceSkuQuery,
  useTraceSkuQuery,
  useGetDashboardSummaryQuery,
} = apiSlice;
