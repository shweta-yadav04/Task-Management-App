const jwt = require('jsonwebtoken');
const User = require('../models/User');


exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User no longer exists.' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

/** Restrict to specific roles */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied: insufficient permissions.' });
  next();
};
