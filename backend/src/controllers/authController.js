const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const LoginActivity = require('../models/loginActivity');
const { generateToken, refreshToken } = require('../middleware/auth');
const { handleValidationError, AppError } = require('../middleware/errorHandler');

class AuthController {
  // User login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { email, password, remember_me = false } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        // Log failed login attempt
        await LoginActivity.logLogin({ email }, false, req);
        
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        await LoginActivity.logLogin(user, false, req);
        
        return res.status(401).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        await LoginActivity.logLogin(user, false, req);
        
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = generateToken(user);

      // Update last login
      await User.updateLastLogin(user.id);

      // Log successful login
      const loginActivity = await LoginActivity.logLogin(user, true, req);

      // Remove password from response
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token: token,
          expires_in: process.env.JWT_EXPIRES_IN || '2d',
          login_activity_id: loginActivity.id
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // User logout
  static async logout(req, res) {
    try {
      const { login_activity_id } = req.body;

      // Record logout time if login activity ID provided
      if (login_activity_id) {
        await LoginActivity.recordLogout(login_activity_id);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password_hash, ...userProfile } = user;

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: userProfile
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update current user profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { username, email, current_password, new_password } = req.body;
      const userId = req.user.id;

      // Get current user
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updateData = {};

      // Update username if provided
      if (username && username !== currentUser.username) {
        updateData.username = username;
      }

      // Update email if provided
      if (email && email !== currentUser.email) {
        updateData.email = email;
      }

      // Update password if provided
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required to change password'
          });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(current_password, currentUser.password_hash);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }

        // Hash new password
        updateData.password_hash = await bcrypt.hash(new_password, 12);
      }

      // Update user if there are changes
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await User.update(userId, updateData);
        
        // Remove password from response
        const { password_hash, ...userResponse } = updatedUser;

        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          data: {
            user: userResponse
          }
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'No changes to update',
          data: {
            user: { ...currentUser, password_hash: undefined }
          }
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Refresh JWT token
  static async refresh(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const newToken = await refreshToken(token);
      if (!newToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          expires_in: process.env.JWT_EXPIRES_IN || '2d'
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      // If we reach here, the auth middleware has already verified the token
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: userResponse,
          valid: true
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Change password (admin or self)
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(handleValidationError(errors));
      }

      const { user_id, new_password, current_password } = req.body;
      const requesterId = req.user.id;
      const requesterRoles = req.user.roles || [];

      // Determine target user ID
      const targetUserId = user_id || requesterId;

      // Check permissions
      const isAdmin = requesterRoles.includes('admin') || requesterRoles.includes('super_admin');
      const isSelf = parseInt(targetUserId) === requesterId;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'You can only change your own password'
        });
      }

      // Get target user
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // If changing own password, verify current password
      if (isSelf && !isAdmin) {
        if (!current_password) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required'
          });
        }

        const isCurrentPasswordValid = await bcrypt.compare(current_password, targetUser.password_hash);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }
      }

      // Hash new password
      const password_hash = await bcrypt.hash(new_password, 12);

      // Update password
      await User.update(targetUserId, { password_hash });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get login history
  static async getLoginHistory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user.id;

      const result = await LoginActivity.getUserLoginHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(200).json({
        success: true,
        message: 'Login history retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get login history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve login history',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AuthController;