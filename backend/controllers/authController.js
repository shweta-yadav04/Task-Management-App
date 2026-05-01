const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email is already registered.' });

    // Assign admin role if email matches the predefined ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL;
    const role = (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) ? 'admin' : 'member';

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid email or password.' });

    const token = signToken(user._id);
    // Strip password from response via toJSON
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
