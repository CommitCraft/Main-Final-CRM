const { body, param, query } = require('express-validator');

// Auth validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
];

const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('current_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password must be at least 6 characters'),
  body('new_password')
    .optional()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number')
];

const changePasswordValidation = [
  body('new_password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('current_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password is required'),
  body('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

// User validation rules
const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  body('roles.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  body('roles.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

const assignRoleValidation = [
  body('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer')
];

// Role validation rules
const createRoleValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9_\s-]+$/)
    .withMessage('Role name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
  body('pages')
    .optional()
    .isArray()
    .withMessage('Pages must be an array'),
  body('pages.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page ID must be a positive integer')
];

const updateRoleValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9_\s-]+$/)
    .withMessage('Role name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
  body('pages')
    .optional()
    .isArray()
    .withMessage('Pages must be an array'),
  body('pages.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page ID must be a positive integer')
];

const roleIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer')
];

const assignPagesValidation = [
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer'),
  body('pageIds')
    .isArray()
    .withMessage('Page IDs must be an array'),
  body('pageIds.*')
    .isInt({ min: 1 })
    .withMessage('Page ID must be a positive integer')
];

// Page validation rules
const createPageValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Page name must be 2-100 characters long'),
  body('url')
    .isLength({ min: 1, max: 255 })
    .matches(/^(\/[a-zA-Z0-9_\-\/]*|https?:\/\/.+)$/)
    .withMessage('URL must be a valid internal path (starting with /) or external URL (http/https)'),
  body('is_external')
    .optional()
    .isBoolean()
    .withMessage('is_external must be a boolean value'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const updatePageValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Page ID must be a positive integer'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Page name must be 2-100 characters long'),
  body('url')
    .optional()
    .isLength({ min: 1, max: 255 })
    .matches(/^(\/[a-zA-Z0-9_\-\/]*|https?:\/\/.+)$/)
    .withMessage('URL must be a valid internal path (starting with /) or external URL (http/https)'),
  body('is_external')
    .optional()
    .isBoolean()
    .withMessage('is_external must be a boolean value'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

const pageIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Page ID must be a positive integer')
];

const pageUrlValidation = [
  param('pageUrl')
    .isLength({ min: 1 })
    .withMessage('Page URL is required')
];

// Export validation rules
const exportValidation = [
  query('format')
    .optional()
    .isIn(['csv', 'json', 'pdf', 'xlsx'])
    .withMessage('Format must be one of: csv, json, pdf, xlsx'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Pagination validation rules
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Stats validation rules
const statsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  query('hours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Hours must be between 1 and 168 (1 week)'),
  query('minutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Minutes must be between 1 and 1440 (24 hours)')
];

module.exports = {
  // Auth validations
  loginValidation,
  registerValidation,
  updateProfileValidation,
  changePasswordValidation,

  // User validations
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  assignRoleValidation,

  // Role validations
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  assignPagesValidation,

  // Page validations
  createPageValidation,
  updatePageValidation,
  pageIdValidation,
  pageUrlValidation,

  // Export validations
  exportValidation,

  // Common validations
  paginationValidation,
  statsValidation
};