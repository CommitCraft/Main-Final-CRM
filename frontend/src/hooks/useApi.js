import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Custom hook for API calls with loading states and error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Configuration options
 * @returns {object} API state and functions
 */
export const useApi = (url, options = {}) => {
  const {
    immediate = false,
    defaultData = null,
    method = 'get',
    showSuccessToast = false,
    showErrorToast = true
  } = options;

  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (params = {}, customUrl = url) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (method.toLowerCase()) {
        case 'post':
          response = await apiService.post(customUrl, params);
          break;
        case 'put':
          response = await apiService.put(customUrl, params);
          break;
        case 'delete':
          response = await apiService.delete(customUrl);
          break;
        default:
          response = await apiService.get(customUrl, params);
      }

      setData(response.data);
      
      if (showSuccessToast && response.data.message) {
        toast.success(response.data.message);
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [url, method, showSuccessToast, showErrorToast]);

  const reset = useCallback(() => {
    setData(defaultData);
    setError(null);
    setLoading(false);
  }, [defaultData]);

  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [immediate, execute, url]);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

/**
 * Custom hook for paginated API calls
 * @param {string} url - API endpoint URL
 * @param {object} options - Configuration options
 * @returns {object} Paginated API state and functions
 */
export const usePaginatedApi = (url, options = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    immediate = false
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const { data, loading, error, execute, reset } = useApi(url, {
    immediate: false,
    defaultData: { items: [], pagination: {} }
  });

  const loadPage = useCallback(async (newPage = page, newLimit = limit, filters = {}) => {
    const params = {
      page: newPage,
      limit: newLimit,
      ...filters
    };

    const result = await execute(params);
    
    if (result.success && result.data.pagination) {
      setTotalPages(result.data.pagination.totalPages || 0);
      setTotalItems(result.data.pagination.total || 0);
      setPage(newPage);
      setLimit(newLimit);
    }

    return result;
  }, [page, limit, execute]);

  const nextPage = () => {
    if (page < totalPages) {
      loadPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      loadPage(page - 1);
    }
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadPage(newPage);
    }
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    loadPage(1, newLimit);
  };

  useEffect(() => {
    if (immediate && url) {
      loadPage();
    }
  }, [immediate, url, loadPage]);

  return {
    data: data.items || [],
    pagination: data.pagination || {},
    loading,
    error,
    page,
    limit,
    totalPages,
    totalItems,
    loadPage,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    reset,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Custom hook for form submissions with API
 * @param {string} url - API endpoint URL
 * @param {object} options - Configuration options
 * @returns {object} Form submission state and functions
 */
export const useApiForm = (url, options = {}) => {
  const {
    method = 'post',
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true
  } = options;

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = useCallback(async (formData) => {
    try {
      setSubmitting(true);
      setErrors({});

      let response;
      switch (method.toLowerCase()) {
        case 'put':
          response = await apiService.put(url, formData);
          break;
        case 'patch':
          response = await apiService.patch(url, formData);
          break;
        default:
          response = await apiService.post(url, formData);
      }

      if (showSuccessToast && response.data.message) {
        toast.success(response.data.message);
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      return { success: true, data: response.data };
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.errors) {
        // Field validation errors
        setErrors(errorData.errors);
      }
      
      const errorMessage = errorData?.message || err.message || 'Submission failed';
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(errorMessage, errorData?.errors);
      }

      return { success: false, error: errorMessage, errors: errorData?.errors };
    } finally {
      setSubmitting(false);
    }
  }, [url, method, onSuccess, onError, showSuccessToast, showErrorToast]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    submit,
    submitting,
    errors,
    clearErrors
  };
};