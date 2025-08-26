const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../middleware/logger');
const { promisify } = require('util');

const router = express.Router();
const query = promisify(db.query).bind(db);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, asyncHandler(async (req, res) => {
  const {
    business_name,
    owner_name,
    email,
    phone,
    password,
    business_address,
    business_type = 'retail'
  } = req.body;

  // Check if user already exists
  const existingUsers = await query(
    'SELECT id FROM users WHERE email = ? OR phone = ?',
    [email, phone]
  );

  if (existingUsers.length > 0) {
    return errorResponse(res, 'User with this email or phone already exists', 400, 'USER_EXISTS');
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Generate UUID
  const uuid = uuidv4();

  // Insert new user
  const result = await query(
    `INSERT INTO users (uuid, business_name, owner_name, email, phone, password_hash, business_address, business_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid, business_name, owner_name, email, phone, password_hash, business_address, business_type]
  );

  // Generate JWT token
  const token = generateToken(result.insertId);

  // Get user data (without password)
  const newUser = await query(
    'SELECT id, uuid, business_name, owner_name, email, phone, business_address, business_type, subscription_plan, created_at FROM users WHERE id = ?',
    [result.insertId]
  );

  successResponse(res, 'User registered successfully', {
    user: newUser[0],
    token
  }, 201);
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const users = await query(
    'SELECT id, uuid, business_name, owner_name, email, phone, password_hash, business_address, business_type, subscription_plan, is_active FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const user = users[0];

  // Check if user is active
  if (!user.is_active) {
    return errorResponse(res, 'Account is deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return errorResponse(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  // Generate JWT token
  const token = generateToken(user.id);

  // Remove password hash from response
  delete user.password_hash;

  successResponse(res, 'Login successful', {
    user,
    token
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await query(
    'SELECT id, uuid, business_name, owner_name, email, phone, business_address, business_type, subscription_plan, email_verified, phone_verified, created_at, last_login FROM users WHERE id = ?',
    [req.user.id]
  );

  if (user.length === 0) {
    return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
  }

  successResponse(res, 'User profile retrieved successfully', user[0]);
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const {
    business_name,
    owner_name,
    phone,
    business_address,
    business_type
  } = req.body;

  const userId = req.user.id;

  // Check if phone is already taken by another user
  if (phone) {
    const existingUsers = await query(
      'SELECT id FROM users WHERE phone = ? AND id != ?',
      [phone, userId]
    );

    if (existingUsers.length > 0) {
      return errorResponse(res, 'Phone number is already taken', 400, 'PHONE_EXISTS');
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];

  if (business_name) {
    updates.push('business_name = ?');
    values.push(business_name);
  }
  if (owner_name) {
    updates.push('owner_name = ?');
    values.push(owner_name);
  }
  if (phone) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (business_address !== undefined) {
    updates.push('business_address = ?');
    values.push(business_address);
  }
  if (business_type) {
    updates.push('business_type = ?');
    values.push(business_type);
  }

  if (updates.length === 0) {
    return errorResponse(res, 'No fields to update', 400, 'NO_UPDATES');
  }

  values.push(userId);

  await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
    values
  );

  // Get updated user data
  const updatedUser = await query(
    'SELECT id, uuid, business_name, owner_name, email, phone, business_address, business_type, subscription_plan, updated_at FROM users WHERE id = ?',
    [userId]
  );

  successResponse(res, 'Profile updated successfully', updatedUser[0]);
}));

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return errorResponse(res, 'Current password and new password are required', 400, 'MISSING_PASSWORDS');
  }

  if (new_password.length < 6) {
    return errorResponse(res, 'New password must be at least 6 characters long', 400, 'PASSWORD_TOO_SHORT');
  }

  const userId = req.user.id;

  // Get current password hash
  const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  
  if (users.length === 0) {
    return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password_hash);
  if (!isCurrentPasswordValid) {
    return errorResponse(res, 'Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  // Hash new password
  const saltRounds = 12;
  const new_password_hash = await bcrypt.hash(new_password, saltRounds);

  // Update password
  await query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [new_password_hash, userId]
  );

  successResponse(res, 'Password changed successfully');
}));

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side by removing the token
  // However, we can log the logout event
  
  successResponse(res, 'Logged out successfully');
}));

module.exports = router;