import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { PaginatedResponse, ProxyIP, ApiResponse } from '../types';

export const useAdminProxies = (page: number, limit: number, search: string) => {
  const queryClient = useQueryClient();

  // Query key is tied to page, limit, and search query parameters
  const queryKey = ['adminProxies', page, limit, search];

  const { data, isLoading, isFetching, refetch } = useQuery<PaginatedResponse<ProxyIP>>({
    queryKey,
    queryFn: async () => {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) {
        query.append('search', search.trim());
      }
      return apiClient<PaginatedResponse<ProxyIP>>(`/api/v1/proxies?${query.toString()}`);
    },
  });

  // 1. Add Proxy Mutation
  const addProxy = useMutation<ApiResponse<ProxyIP>, Error, Omit<ProxyIP, 'id'>>({
    mutationFn: async (newProxy) => {
      return apiClient<ApiResponse<ProxyIP>>('/api/v1/proxies', {
        method: 'POST',
        body: JSON.stringify(newProxy),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProxies'] });
    },
  });

  // 2. Edit Proxy Mutation
  const editProxy = useMutation<
    ApiResponse<ProxyIP>,
    Error,
    { id: number; data: Omit<ProxyIP, 'id'> }
  >({
    mutationFn: async ({ id, data }) => {
      return apiClient<ApiResponse<ProxyIP>>(`/api/v1/proxies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProxies'] });
    },
  });

  // 3. Delete Proxy Mutation
  const deleteProxy = useMutation<ApiResponse<any>, Error, number>({
    mutationFn: async (id) => {
      return apiClient<ApiResponse<any>>(`/api/v1/proxies/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProxies'] });
    },
  });

  // 4. Import Proxies Mutation
  const importProxies = useMutation<ApiResponse<any>, Error, string>({
    mutationFn: async (jsonText) => {
      return apiClient<ApiResponse<any>>('/api/v1/proxies/import', {
        method: 'POST',
        body: JSON.stringify({ proxies: JSON.parse(jsonText) }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProxies'] });
    },
  });

  // 5. Sync Health Mutation
  const syncHealth = useMutation<ApiResponse<any>, Error, void>({
    mutationFn: async () => {
      return apiClient<ApiResponse<any>>('/api/v1/proxies/sync-health', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProxies'] });
    },
  });

  // 6. Fetch GeoIP Details
  const fetchGeoIP = async (ip: string): Promise<ApiResponse<Partial<ProxyIP>>> => {
    return apiClient<ApiResponse<Partial<ProxyIP>>>(
      `/api/v1/proxies/geoip?ip=${encodeURIComponent(ip.trim())}`
    );
  };

  return {
    proxies: data?.data || [],
    total: data?.pagination.total || 0,
    isLoading,
    isFetching,
    refetch,
    addProxy,
    editProxy,
    deleteProxy,
    importProxies,
    syncHealth,
    fetchGeoIP,
  };
};
