// Pagination utility functions

/**
 * Create pagination metadata
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
const createPagination = (page, limit, total) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.max(1, parseInt(limit) || 10);
  const totalItems = parseInt(total) || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    current_page: currentPage,
    items_per_page: itemsPerPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_previous: currentPage > 1,
    has_next: currentPage < totalPages,
    previous_page: currentPage > 1 ? currentPage - 1 : null,
    next_page: currentPage < totalPages ? currentPage + 1 : null,
    offset: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage
  };
};

/**
 * Calculate LIMIT and OFFSET for SQL queries
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of items per page
 * @returns {Object} Object with limit and offset values
 */
const getPaginationParams = (page = 1, limit = 10) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.max(1, Math.min(parseInt(limit), 1000)); // Max 1000 items per page
  
  return {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  };
};

/**
 * Create pagination links for API responses
 * @param {string} baseUrl - Base URL for the API endpoint
 * @param {Object} pagination - Pagination metadata
 * @param {Object} queryParams - Additional query parameters
 * @returns {Object} Pagination links
 */
const createPaginationLinks = (baseUrl, pagination, queryParams = {}) => {
  const { current_page, total_pages, has_previous, has_next } = pagination;
  
  // Build query string
  const buildUrl = (page) => {
    const params = new URLSearchParams({ ...queryParams, page: page.toString() });
    return `${baseUrl}?${params.toString()}`;
  };
  
  const links = {
    self: buildUrl(current_page),
    first: buildUrl(1),
    last: buildUrl(total_pages)
  };
  
  if (has_previous) {
    links.previous = buildUrl(current_page - 1);
  }
  
  if (has_next) {
    links.next = buildUrl(current_page + 1);
  }
  
  return links;
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validated parameters with defaults
 */
const validatePaginationParams = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.max(1, Math.min(parseInt(limit) || 10, 1000));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    isValid: true
  };
};

/**
 * Create a paginated response object
 * @param {Array} data - Array of items for current page
 * @param {Object} paginationMeta - Pagination metadata
 * @param {string} message - Response message
 * @returns {Object} Standardized paginated response
 */
const createPaginatedResponse = (data, paginationMeta, message = 'Data retrieved successfully') => {
  return {
    success: true,
    message,
    data: data,
    pagination: paginationMeta,
    meta: {
      count: data.length,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Calculate page numbers for pagination component
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum visible page numbers
 * @returns {Array} Array of page numbers to display
 */
const getVisiblePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Create search and filter parameters for pagination
 * @param {Object} query - Query parameters from request
 * @returns {Object} Cleaned search and filter parameters
 */
const createSearchParams = (query) => {
  const searchParams = {};
  
  // Common search parameters
  if (query.search && query.search.trim()) {
    searchParams.search = query.search.trim();
  }
  
  if (query.status) {
    searchParams.status = query.status;
  }
  
  if (query.sort_by) {
    searchParams.sort_by = query.sort_by;
  }
  
  if (query.sort_order && ['asc', 'desc'].includes(query.sort_order.toLowerCase())) {
    searchParams.sort_order = query.sort_order.toLowerCase();
  }
  
  if (query.date_from) {
    searchParams.date_from = query.date_from;
  }
  
  if (query.date_to) {
    searchParams.date_to = query.date_to;
  }
  
  return searchParams;
};

/**
 * Build ORDER BY clause for SQL queries
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {Array} allowedFields - Allowed fields for sorting
 * @param {string} defaultSort - Default sort field
 * @returns {string} ORDER BY clause
 */
const buildSortClause = (sortBy, sortOrder = 'desc', allowedFields = [], defaultSort = 'created_at') => {
  const field = allowedFields.includes(sortBy) ? sortBy : defaultSort;
  const order = ['asc', 'desc'].includes(sortOrder?.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
  
  return `ORDER BY ${field} ${order}`;
};

/**
 * Create cursor-based pagination (for real-time data)
 * @param {string} cursor - Current cursor position
 * @param {number} limit - Number of items to fetch
 * @returns {Object} Cursor pagination parameters
 */
const createCursorPagination = (cursor, limit = 10) => {
  return {
    cursor: cursor || null,
    limit: Math.max(1, Math.min(parseInt(limit) || 10, 100)),
    hasMore: false // Will be set based on query results
  };
};

/**
 * Format pagination info for display
 * @param {Object} pagination - Pagination metadata
 * @returns {string} Human-readable pagination info
 */
const formatPaginationInfo = (pagination) => {
  const { current_page, items_per_page, total_items, total_pages } = pagination;
  
  if (total_items === 0) {
    return 'No items found';
  }
  
  const start = (current_page - 1) * items_per_page + 1;
  const end = Math.min(current_page * items_per_page, total_items);
  
  return `Showing ${start}-${end} of ${total_items} items (Page ${current_page} of ${total_pages})`;
};

module.exports = {
  createPagination,
  getPaginationParams,
  createPaginationLinks,
  validatePaginationParams,
  createPaginatedResponse,
  getVisiblePageNumbers,
  createSearchParams,
  buildSortClause,
  createCursorPagination,
  formatPaginationInfo
};