import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Home,
  Search,
  Link as LinkIcon,
  Eye,
  Shield,
  Globe,
  Monitor,
} from "lucide-react";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/AuthContext";
import { apiService, endpoints } from "../utils/api";
import { isValidUrl } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const PageModal = ({ isOpen, onClose, page, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    url_type: "internal",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (page) {
      setFormData({
        name: page.name || "",
        url: page.url || "",
        url_type: page.is_external ? "external" : "internal",
        is_active: page.status === "active",
      });
    } else {
      setFormData({
        name: "",
        url: "",
        url_type: "internal",
        is_active: true,
      });
    }
    setErrors({});
  }, [page, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Page name is required";
    }

    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else if (formData.url_type === "external" && !isValidUrl(formData.url)) {
      newErrors.url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Transform frontend data to match backend expectations
      const backendData = {
        name: formData.name,
        url: formData.url,
        is_external: formData.url_type === "external" ? 1 : 0,
        status: formData.is_active ? "active" : "inactive",
      };

      // Append all transformed fields
      Object.keys(backendData).forEach((key) => {
        formDataToSend.append(key, backendData[key]);
      });

      if (page) {
        await apiService.put(
          `${endpoints.pages.list}/${page.id}`,
          formDataToSend
        );
        // toast.success('Page updated successfully');
        toast.success("Page updated successfully", {
          style: {
            background: "#1f2937", // dark gray background
            color: "#e5e7eb", // light gray text
            border: "1px solid #374151",
          },
          iconTheme: {
            primary: "#10b981", // emerald green icon
            secondary: "#1f2937",
          },
        });
      } else {
        await apiService.post(endpoints.pages.list, formDataToSend);
        //toast.success('Page created successfully');
        toast.success("Page created successfully", {
          style: {
            background: "#1f2937",
            color: "#e5e7eb",
            border: "1px solid #374151",
          },
          iconTheme: {
            primary: "#3b82f6", // blue accent
            secondary: "#1f2937",
          },
        });
      }

      onSave();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save page";
      // toast.error(message);
      toast.error(message, {
        style: {
          background: "#1f2937",
          color: "#f87171", // red text for error
          border: "1px solid #4b5563",
        },
        iconTheme: {
          primary: "#f87171",
          secondary: "#1f2937",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {page ? "Edit Page" : "Add New Page"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Page Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Page Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.name
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter page name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* URL Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="url_type"
                  value="internal"
                  checked={formData.url_type === "internal"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  Internal Route
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="url_type"
                  value="external"
                  checked={formData.url_type === "external"}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  External URL
                </span>
              </label>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.url_type === "internal" ? "Route Path" : "External URL"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {formData.url_type === "internal" ? (
                  <Home className="h-4 w-4 text-gray-400" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.url
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  formData.url_type === "internal"
                    ? "/dashboard"
                    : "https://example.com"
                }
              />
            </div>
            {errors.url && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.url}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.url_type === "internal"
                ? "Enter the internal route path (e.g., /dashboard, /users)"
                : "Enter the full external URL including https://"}
            </p>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                Active
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Inactive pages won't appear in navigation
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {page ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PagesPage = () => {
  const { hasRole } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      // Use different endpoints based on user role
      const endpoint = hasRole("Super Admin")
        ? endpoints.pages.list
        : endpoints.pages.myPages;
      const response = await apiService.get(endpoint);
      // The backend returns: { success, message, data: { pages: [...], pagination: {...} } }
      setPages(response.data.data?.pages || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
      // toast.error('Failed to fetch pages');
      toast.error("Failed to fetch pages", {
        style: {
          background: "#1f2937", // dark gray
          color: "#fca5a5", // soft red text for contrast
          border: "1px solid #4b5563",
          borderRadius: "8px",
        },
        iconTheme: {
          primary: "#ef4444", // bright red icon
          secondary: "#1f2937", // matches dark bg
        },
      });
      setPages([]); // Ensure pages is always an array
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleDeletePage = async (pageId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this page? This will also remove it from all roles."
      )
    ) {
      try {
        await apiService.delete(`${endpoints.pages.list}/${pageId}`);
        toast.success("Page deleted successfully");
        fetchPages();
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to delete page";
        toast.error(message);
      }
    }
  };

  const handleAddPage = () => {
    setSelectedPage(null);
    setIsModalOpen(true);
  };

  const handleEditPage = (page) => {
    setSelectedPage(page);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPage(null);
  };

  const handleModalSave = () => {
    fetchPages();
  };

  const filteredPages = Array.isArray(pages)
    ? pages.filter(
        (page) =>
          page.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          page.url?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getUrlTypeBadge = (urlType) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          urlType === "internal"
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        }`}
      >
        {urlType === "internal" ? (
          <Home className="h-3 w-3 mr-1" />
        ) : (
          <ExternalLink className="h-3 w-3 mr-1" />
        )}
        {urlType === "internal" ? "Internal" : "External"}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with improved styling */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              Pages Management
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage application pages and navigation structure
            </p>
          </div>
          <button
            onClick={handleAddPage}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Page
          </button>
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages by name or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {filteredPages.length > 0 && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredPages.length}
              </span>{" "}
              {filteredPages.length === 1 ? "page" : "pages"}
            </div>
          )}
        </div>

        {/* Pages Table with enhanced design */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPages.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm
                              ? "No pages found matching your search."
                              : "No pages configured yet."}
                          </p>
                          {!searchTerm && (
                            <button
                              onClick={handleAddPage}
                              className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Page
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredPages.map((page) => (
                        <tr
                          key={page.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {page.icon_url ? (
                                  <img
                                    src={page.icon_url}
                                    alt={page.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {page.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {page.url}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900 dark:text-white font-mono">
                                {page.url}
                              </span>
                              {page.url_type === "external" && (
                                <ExternalLink className="h-3 w-3 text-gray-400 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUrlTypeBadge(
                              page.is_external ? "external" : "internal"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(page.status === "active")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {page.url_type === "external" && (
                                <a
                                  href={page.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
                                  title="Open external page"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleEditPage(page)}
                                className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
                                title="Edit page"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePage(page.id)}
                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                title="Delete page"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Pages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pages.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Internal Pages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pages.filter((p) => !p.is_external).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  External Pages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pages.filter((p) => p.is_external).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Pages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pages.filter((p) => p.status === "active").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Modal */}
        <PageModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          page={selectedPage}
          onSave={handleModalSave}
        />
      </div>
    </Layout>
  );
};

export default PagesPage;
