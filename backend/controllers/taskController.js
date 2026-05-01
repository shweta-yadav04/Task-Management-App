const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Members only see tasks within their projects
    if (req.user.role !== 'admin') {
      const myProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      const ids = myProjects.map((p) => p._id);
      filter.project = filter.project
        ? (ids.map(String).includes(String(filter.project)) ? filter.project : null)
        : { $in: ids };
    }

    const tasks = await Task.find(filter)
      .populate('project', 'title color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate } = req.body;
    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });
    await task.populate('project', 'title color');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (req.user.role !== 'admin') {
      // Members can only update status on their own tasks
      if (!task.assignedTo || !task.assignedTo.equals(req.user._id))
        return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
      task.status = req.body.status ?? task.status;
    } else {
      Object.assign(task, req.body);
    }

    await task.save();
    await task.populate('project', 'title color');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/stats  (dashboard counts)
exports.getStats = async (req, res) => {
  try {
    const projectFilter =
      req.user.role === 'admin'
        ? {}
        : {
            $or: [{ owner: req.user._id }, { members: req.user._id }],
          };

    const myProjects = await Project.find(projectFilter).select('_id');
    const projectIds = myProjects.map((p) => p._id);

    const [total, done, inProgress, overdue] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
    ]);

    res.json({ total, done, inProgress, overdue, todo: total - done - inProgress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
