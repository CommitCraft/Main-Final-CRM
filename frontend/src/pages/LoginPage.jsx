import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Monitor, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isValidEmail } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden
      bg-gradient-to-br from-blue-100 via-indigo-200 to-purple-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">

      {/* Floating Orbs Background */}
      <motion.div
        className="absolute top-10 left-10 w-72 h-72 bg-purple-400 rounded-full filter blur-3xl opacity-25"
        animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20"
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full z-10 p-8"
      >
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
            shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="h-5 w-5 text-gray-700" /> : <Sun className="h-5 w-5 text-yellow-400" />}
          </button>
        </div>

        {/* Logo */}
        <motion.div
          className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-2xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Monitor className="h-10 w-10 text-white" />
        </motion.div>

        <div className="text-center mb-6">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white"
          >
            Saral Tech Dashboard
          </motion.h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Saral Tech Dashboard</p>
        </div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border shadow-sm transition-all
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white
                ${errors.email ? 'border-red-400 ring-red-300' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border shadow-sm transition-all
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white
                  ${errors.password ? 'border-red-400 ring-red-300' : 'border-gray-300 dark:border-gray-600'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className="w-full py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r
              from-indigo-600 to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? <LoadingSpinner size="sm" /> : <><LogIn className="inline h-5 w-5 mr-2" />Sign In</>}
            </motion.button>
          </div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6"
        >
          Saral Tech Dashboard v1.0 • Made with ❤️ by Saral Technologies
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
