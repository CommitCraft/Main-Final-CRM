import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  FileText,
  CheckSquare,
  Square,
  Search,
  Settings,
} from "lucide-react";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/AuthContext";
import { apiService, endpoints } from "../utils/api";
import { formatDateTime } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import PageArrangement from "../components/PageArrangement";
import toast from "react-hot-toast";

const RoleModal = ({ isOpen, onClose, role, pages, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    page_ids: [],
    pagesWithOrder: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadRolePageOrder = async () => {
      if (role && role.id) {
        setLoadingOrder(true);
        try {
          const response = await apiService.get(endpoints.roles.pageOrder(role.id));
          console.log('📥 Role page order response:', response.data);
          const pageOrder = response.data.data?.pages || response.data.pages || [];
          console.log('📊 Parsed page order:', pageOrder);
          
          setFormData({
            name: role.name || "",
            description: role.description || "",
            page_ids: role.page_ids || [],
            pagesWithOrder: pageOrder,
          });
        } catch (error) {
          console.error('❌ Failed to load role page order:', error);
          setFormData({
            name: role.name || "",
            description: role.description || "",
            page_ids: role.page_ids || [],
            pagesWithOrder: [],
          });
        } finally {
          setLoadingOrder(false);
        }
      } else {
        setFormData({
          name: "",
          description: "",
          page_ids: [],
          pagesWithOrder: [],
        });
      }
      setErrors({});
    };
    
    if (isOpen) {
      loadRolePageOrder();
    }
  }, [role, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data with correct field names for backend
      const submitData = {
        name: formData.name,
        description: formData.description,
        pagesWithOrder: formData.pagesWithOrder, // Send page ordering info
      };

      if (role) {
        await apiService.put(`${endpoints.roles.list}/${role.id}`, submitData);
        toast.success("Role updated successfully", {
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
      } else {
        await apiService.post(endpoints.roles.list, submitData);
        toast.success("Role created successfully", {
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

      // Call onSave first, then close modal after a short delay
      onSave();
      setTimeout(() => {
        onClose();
      }, 50);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save role";
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
            {role ? "Edit Role" : "Add New Role"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name
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
              placeholder="Enter role name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.description
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter role description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </div>

          {/* Page Permissions with Arrangement */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Page Permissions & Menu Structure
            </h4>
            {loadingOrder ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading page order...</span>
              </div>
            ) : (
              <PageArrangement
                pages={pages}
                value={formData.pagesWithOrder}
                onChange={(pagesWithOrder) => setFormData(prev => ({ ...prev, pagesWithOrder }))}
              />
            )}
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
              {role ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RolesPage = () => {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);

      // Add cache-busting parameter to ensure fresh data
      const response = await apiService.get(endpoints.roles.list, {
        params: { _t: Date.now() },
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });

      // The backend returns: { success, message, data: { roles: [...], pagination: {...} } }
      const newRoles = response.data.data?.roles || [];

      setRoles(newRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles", {
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
      setRoles([]); // Ensure roles is always an array
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      const response = await apiService.get(endpoints.pages.list);
      // The backend returns: { success, message, data: { pages: [...], pagination: {...} } }
      const allPages = response.data.data?.pages || [];

      // Filter out unwanted pages
      const unwantedPages = [
        "activity logs",
        "company website",
        "documentation",
        "help center",
      ];
      const filteredPages = allPages.filter(
        (page) =>
          !unwantedPages.some((unwanted) =>
            page.name?.toLowerCase().includes(unwanted.toLowerCase())
          )
      );

      setPages(filteredPages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      setPages([]); // Ensure pages is always an array
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPages();
  }, [fetchRoles, fetchPages]);

  const handleDeleteRole = async (roleId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this role? Users with this role will lose their permissions."
      )
    ) {
      try {
        await apiService.delete(`${endpoints.roles.list}/${roleId}`);
        toast.success("Role deleted successfully");
        fetchRoles();
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to delete role";
        toast.error(message);
      }
    }
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleModalSave = () => {
    fetchRoles();
    // Let the app (e.g., sidebar) know permissions may have changed
    window.dispatchEvent(new Event("permissions-updated"));
  };

  const filteredRoles = useMemo(() => {
    return Array.isArray(roles)
      ? roles.filter(
          (role) =>
            role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];
  }, [roles, searchTerm]);

  const getAssignedPagesDisplay = (pageIds, rolePages) => {
    // Try rolePages first (page names array)
    if (rolePages && Array.isArray(rolePages) && rolePages.length > 0) {
      return rolePages.length <= 3
        ? rolePages.join(", ")
        : `${rolePages.slice(0, 3).join(", ")} +${rolePages.length - 3} more`;
    }

    // Try pageIds with available pages
    if (
      pageIds &&
      Array.isArray(pageIds) &&
      pageIds.length > 0 &&
      pages.length > 0
    ) {
      const assignedPages = pages.filter(
        (page) =>
          pageIds.includes(parseInt(page.id)) ||
          pageIds.includes(String(page.id))
      );

      if (assignedPages.length > 0) {
        const names = assignedPages.map((p) => p.name);
        return names.length <= 3
          ? names.join(", ")
          : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
      }
    }

    return "No pages assigned";
  };

  const getPageCount = (pageIds, rolePages) => {
    if (rolePages && Array.isArray(rolePages)) return rolePages.length;
    if (pageIds && Array.isArray(pageIds)) return pageIds.length;
    return 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              Roles Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Configure roles and assign page permissions
            </p>
          </div>
          <div>
            <button
              onClick={handleAddRole}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-md font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Role
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-shadow"
              />
            </div>
            {searchTerm && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {filteredRoles.length} result
                  {filteredRoles.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Roles Grid */}
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
  {loading ? (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  ) : (
    <>
      {filteredRoles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No roles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "Get started by creating your first role."}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddRole}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Your First Role
            </button>
          )}
        </div>
      ) : (
        // 🧱 GRID SECTION
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="border border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center shadow-sm">
                        <Shield className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {role.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {role.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-2.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:text-primary-400 rounded-lg transition-all duration-150"
                    title="Edit role"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg transition-all duration-150"
                    title="Delete role"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Assigned Pages
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {getAssignedPagesDisplay(role.page_ids, role.pages)}
                        <span className="text-gray-500 dark:text-gray-400">
                          ({getPageCount(role.page_ids, role.pages)} total)
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Created
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {role.created_at
                          ? formatDateTime(role.created_at)
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{role.user_count || 0} users assigned</span>
                  </div>
                </div>

                {/* <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-2.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:text-primary-400 rounded-lg transition-all duration-150"
                    title="Edit role"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg transition-all duration-150"
                    title="Delete role"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )}
</div>


        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Total Roles
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {roles.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl shadow-lg border border-green-200 dark:border-green-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Available Pages
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pages.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700/50 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Active Permissions
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {roles.reduce(
                    (total, role) => total + (role.page_ids || []).length,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Modal */}
        <RoleModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          role={selectedRole}
          pages={pages}
          onSave={handleModalSave}
        />
      </div>
    </Layout>
  );
};

export default RolesPage;
