import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  // Check if user is already authenticated via Google
  if (req.user && req.user.token) {
    req.userId = req.user.user._id;
    return next();
  }

  // If not, check for JWT token
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token is required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: 'Token has expired' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export default authenticateToken;
