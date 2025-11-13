// Export all models from a single index file
const User = require('./user');
const Role = require('./role');
const Page = require('./page');
const ActivityLog = require('./activityLog');
const LoginActivity = require('./loginActivity');
const { UserRole, RolePage } = require('./userRole');

module.exports = {
  User,
  Role,
  Page,
  ActivityLog,
  LoginActivity,
  UserRole,
  RolePage
};