const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort('-createdAt');

    // Attach task stats
    const data = await Promise.all(
      projects.map(async (p) => {
        const [total, done, overdue] = await Promise.all([
          Task.countDocuments({ project: p._id }),
          Task.countDocuments({ project: p._id, status: 'done' }),
          Task.countDocuments({
            project: p._id,
            status: { $ne: 'done' },
            dueDate: { $lt: new Date() },
          }),
        ]);
        return { ...p.toObject(), taskCount: total, doneCount: done, overdueCount: overdue };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { title, description, members, color, status } = req.body;
    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      members: members || [],
      color: color || '#7C6FFF',
      status: status || 'active',
    });
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    res.status(201).json({ ...project.toObject(), taskCount: 0, doneCount: 0, overdueCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Access check for members
    if (req.user.role !== 'admin') {
      const isMember =
        project.owner._id.equals(req.user._id) ||
        project.members.some((m) => m._id.equals(req.user._id));
      if (!isMember) return res.status(403).json({ message: 'Access denied.' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ ...project.toObject(), tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Project and its tasks deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!project.members.map(String).includes(String(userId))) {
      project.members.push(userId);
      await project.save();
    }
    await project.populate('members', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    res.json({ message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
