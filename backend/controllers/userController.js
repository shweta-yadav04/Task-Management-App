const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/users  (admin only – for assignment dropdowns)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/users/me  – update own name
exports.updateMe = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required.' });
    const user = await User.findByIdAndUpdate(req.user._id, { name: name.trim() }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me/password  – change own password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });
    user.password = newPassword; // pre-save hook will hash it
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/users/:id/role  (admin only)
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role))
      return res.status(400).json({ message: 'Invalid role.' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
