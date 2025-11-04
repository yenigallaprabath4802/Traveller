const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required',
      error: 'No token provided'
    });
  }

  const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token',
        error: err.message
      });
    }
    
    // Add user info to request object
    req.user = { 
      id: decoded.id,
      userId: decoded.id // For compatibility with social service
    };
    next();
  });
};

module.exports = authMiddleware;