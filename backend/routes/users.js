const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const { getUsers, getMe, updateMe, updatePassword, updateRole } = require('../controllers/userController');

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/password', updatePassword);
router.get('/', requireRole('admin'), getUsers);
router.patch('/:id/role', requireRole('admin'), updateRole);

module.exports = router;
