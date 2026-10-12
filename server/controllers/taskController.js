const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get all tasks for the logged in user with search, filters, and sorting
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority, projectId, sort, page = 1, limit = 100 } = req.query;

    const query = { user: req.user._id };

    // Status filter
    if (status && ['todo', 'in_progress', 'completed'].includes(status)) {
      query.status = status;
    }

    // Priority filter
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = priority;
    }

    // Project filter
    if (projectId) {
      if (projectId === 'unassigned') {
        query.project = null;
      } else {
        query.project = projectId;
      }
    }

    // Search by title or description
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sort === 'dueDate') {
      sortOptions = { dueDate: 1, createdAt: -1 };
    } else if (sort === 'priority') {
      // Custom priority sort can be managed in client or by priority rank
      sortOptions = { priority: 1, createdAt: -1 };
    } else if (sort === 'title') {
      sortOptions = { title: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('project', 'name color')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict IDOR protection
    }).populate('project', 'name color');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project } = req.body;

    // Verify project belongs to user if provided
    if (project) {
      const existingProject = await Project.findOne({
        _id: project,
        user: req.user._id,
      });

      if (!existingProject) {
        return res.status(400).json({
          success: false,
          message: 'Specified project does not exist or does not belong to you',
        });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      project: project || null,
      user: req.user._id,
    });

    const populatedTask = await Task.findById(task._id).populate('project', 'name color');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict IDOR protection
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    // Verify project ownership if updating project
    if (project !== undefined && project !== null && project !== '') {
      const existingProject = await Project.findOne({
        _id: project,
        user: req.user._id,
      });

      if (!existingProject) {
        return res.status(400).json({
          success: false,
          message: 'Specified project does not exist or does not belong to you',
        });
      }
      task.project = project;
    } else if (project === null || project === '') {
      task.project = null;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id).populate('project', 'name color');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict IDOR protection
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    await Task.deleteOne({ _id: task._id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
