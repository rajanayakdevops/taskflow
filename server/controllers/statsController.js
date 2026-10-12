const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard metrics and summaries for current user
// @route   GET /api/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run parallel aggregation for fast dashboard loading
    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      overdueTasks,
      recentTasks,
      projects,
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'todo' }),
      Task.countDocuments({ user: userId, status: 'in_progress' }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({ user: userId, priority: 'high' }),
      Task.countDocuments({ user: userId, priority: 'medium' }),
      Task.countDocuments({ user: userId, priority: 'low' }),
      Task.countDocuments({
        user: userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date() },
      }),
      Task.find({ user: userId })
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(5),
      Project.find({ user: userId }).sort({ createdAt: -1 }).limit(4),
    ]);

    // Calculate completion percentage
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get metrics for recent projects
    const projectSummaries = await Promise.all(
      projects.map(async (project) => {
        const pTotal = await Task.countDocuments({ project: project._id, user: userId });
        const pCompleted = await Task.countDocuments({
          project: project._id,
          user: userId,
          status: 'completed',
        });
        const pProgress = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0;
        return {
          _id: project._id,
          name: project.name,
          color: project.color,
          status: project.status,
          totalTasks: pTotal,
          completedTasks: pCompleted,
          progress: pProgress,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        counts: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          completionRate,
        },
        priorities: {
          high: highPriorityTasks,
          medium: mediumPriorityTasks,
          low: lowPriorityTasks,
        },
        recentTasks,
        projects: projectSummaries,
        totalProjects: await Project.countDocuments({ user: userId }),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
