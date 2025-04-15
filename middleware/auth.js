const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and protect routes
const verifyToken = (req, res, next) => {
  // Get token from header, query string, or cookies
  const token = 
    req.headers.authorization?.split(' ')[1] || 
    req.query.token || 
    req.cookies.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt-fallback-secret');
    
    // Add user info to request
    req.user = decoded;
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please log in again.' 
    });
  }
};

module.exports = {
  verifyToken
};