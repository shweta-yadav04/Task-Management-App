const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getStats,
} = require('../controllers/taskController');

router.use(protect);

router.get('/stats', getStats);

router.route('/')
  .get(getTasks)
  .post(requireRole('admin'), createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .patch(updateTask)          // member can update status of own task
  .delete(requireRole('admin'), deleteTask);

module.exports = router;
