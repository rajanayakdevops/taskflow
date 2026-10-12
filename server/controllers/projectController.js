const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all projects for the logged-in user with task completion metrics
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status && ['active', 'archived', 'completed'].includes(status)) {
      filter.status = status;
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    // Aggregate tasks count & completion for each project
    const projectsWithMetrics = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({
          project: project._id,
          user: req.user._id,
        });

        const completedTasks = await Task.countDocuments({
          project: project._id,
          user: req.user._id,
          status: 'completed',
        });

        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project.toObject(),
          totalTasks,
          completedTasks,
          progress,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithMetrics.length,
      data: projectsWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project with associated tasks
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict IDOR protection
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you are not authorized to view it.',
      });
    }

    const tasks = await Task.find({
      project: project._id,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        progress,
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      color: color || '#10b981',
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        ...project.toObject(),
        totalTasks: 0,
        completedTasks: 0,
        progress: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const { name, description, color, status } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict IDOR protection
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or unauthorized',
      });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;
    if (status !== undefined) project.status = status;

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project and cascade delete or unlink associated tasks
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict IDOR protection
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or unauthorized',
      });
    }

    // Unlink or delete associated tasks belonging to user
    await Task.deleteMany({ project: project._id, user: req.user._id });
    await Project.deleteOne({ _id: project._id });

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
