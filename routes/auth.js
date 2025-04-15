// Simplified mock implementation for auth routes
const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Admin login simulation
 * @access  Public
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple mock authentication (for demo purposes only)
  if (username === 'admin' && password === 'password') {
    res.cookie('token', 'mock-jwt-token', {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Administrator'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout simulation
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ 
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token simulation
 * @access  Public
 */
router.get('/verify', (req, res) => {
  const token = req.cookies.token;
  
  if (token === 'mock-jwt-token') {
    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Administrator'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      isAuthenticated: false
    });
  }
});

module.exports = router;