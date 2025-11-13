import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from "lucide-react";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/AuthContext";
import { apiService, endpoints } from "../utils/api";
import { formatDateTime, isValidEmail } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import UserPagesModal from "../components/UserPagesModal";
import toast from "react-hot-toast";

const UserModal = ({ isOpen, onClose, user, roles, onSave }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "",
    status: "active",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role_id: user.role_id || "",
        status: user.status || "active",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        role_id: "",
        status: "active",
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!user && !formData.password) {
      newErrors.password = "Password is required for new users";
    }

    if (!formData.role_id) {
      newErrors.role_id = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (user && !payload.password) {
        delete payload.password; // Don't send empty password for updates
      }

      // Convert role_id to roles array for backend
      if (payload.role_id) {
        payload.roles = [parseInt(payload.role_id)];
        delete payload.role_id;
      } else {
        payload.roles = [];
      }

      if (user) {
        await apiService.put(`${endpoints.users.list}/${user.id}`, payload);
        toast.success("User updated successfully", {
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
        await apiService.post(endpoints.users.list, payload);
        toast.success("User created successfully", {
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
      }

      onSave();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save user";
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
            {user ? "Edit User" : "Add New User"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.username
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.email
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password{" "}
              {user && (
                <span className="text-gray-500">
                  (leave blank to keep current)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  errors.password
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={user ? "Enter new password" : "Enter password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                errors.role_id
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.role_id}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {user ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPagesModalOpen, setIsPagesModalOpen] = useState(false);
  const [selectedUserForPages, setSelectedUserForPages] = useState(null);
  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
      };
      const response = await apiService.get(endpoints.users.list, { params });
      // The backend returns: { success, message, data: { users: [...], pagination: {...} } }
      const data = response.data.data || {};
      setUsers(data.users || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / usersPerPage));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users", {
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
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiService.get(endpoints.roles.simple);
      // The backend returns: { success, message, data: { roles: [...] } }
      setRoles(response.data.data?.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]); // Ensure roles is always an array
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiService.delete(`${endpoints.users.list}/${userId}`);
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to delete user";
        toast.error(message);
      }
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSave = () => {
    fetchUsers();
    // Notify other components (e.g., sidebar) to refresh permissions
    window.dispatchEvent(new Event("permissions-updated"));
  };

  const handleViewUserPages = (user) => {
    setSelectedUserForPages(user);
    setIsPagesModalOpen(true);
  };

  const handlePagesModalClose = () => {
    setIsPagesModalOpen(false);
    setSelectedUserForPages(null);
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getStatusBadge = (status) => {
    const isActive = status === "active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {isActive ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <XCircle className="h-3 w-3 mr-1" />
        )}
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Unknown Role";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              Users Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-md font-medium"
          >
            <Plus className="h-5 w-5" />
            Add User
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-shadow"
              />
            </div>
            {searchTerm && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {filteredUsers.length} result
                  {filteredUsers.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No users found
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center shadow-sm">
                                  <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {user.username}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {getRoleName(user.role_id)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.last_login
                              ? formatDateTime(user.last_login)
                              : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewUserPages(user)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors duration-150"
                                title="View assigned pages"
                              >
                                <Monitor className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:text-primary-400 rounded-lg transition-colors duration-150"
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg transition-colors duration-150"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Showing page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Modal */}
        <UserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          user={selectedUser}
          roles={roles}
          onSave={handleModalSave}
        />

        {/* User Pages Modal */}
        <UserPagesModal
          isOpen={isPagesModalOpen}
          onClose={handlePagesModalClose}
          user={selectedUserForPages}
        />
      </div>
    </Layout>
  );
};

export default UsersPage;
