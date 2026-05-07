const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(requireRole('admin'), createProject);

router.route('/:id')
  .get(getProject)
  .patch(requireRole('admin'), updateProject)
  .put(requireRole('admin'), updateProject)
  .delete(requireRole('admin'), deleteProject);

router.post('/:id/members', requireRole('admin'), addMember);
router.delete('/:id/members/:userId', requireRole('admin'), removeMember);

module.exports = router;
