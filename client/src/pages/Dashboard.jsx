import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  ListTodo,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { statsService } from '../services/statsService';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import Button from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

const Dashboard = () => {
  const { onOpenNewTask, onOpenNewProject } = useOutletContext();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await statsService.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Listen for cross-component task/project updates
    const handleUpdate = () => fetchStats();
    window.addEventListener('taskflow:task-updated', handleUpdate);
    window.addEventListener('taskflow:project-updated', handleUpdate);

    return () => {
      window.removeEventListener('taskflow:task-updated', handleUpdate);
      window.removeEventListener('taskflow:project-updated', handleUpdate);
    };
  }, [fetchStats]);

  const toggleTaskStatus = async (task) => {
    try {
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      await taskService.updateTask(task._id, { status: nextStatus });
      showToast(
        nextStatus === 'completed' ? 'Task marked as completed!' : 'Task marked as to-do',
        'success'
      );
      fetchStats();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const counts = stats?.counts || { total: 0, todo: 0, inProgress: 0, completed: 0, completionRate: 0 };
  const priorities = stats?.priorities || { high: 0, medium: 0, low: 0 };
  const recentTasks = stats?.recentTasks || [];
  const projects = stats?.projects || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Workspace Overview
            </h2>
            <span className="p-1 rounded-md bg-brand-500/10 text-brand-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time activity and project progress metrics loaded from MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button onClick={onOpenNewProject} variant="secondary" size="sm">
            + Project
          </Button>
          <Button onClick={onOpenNewTask} variant="primary" size="sm">
            + New Task
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{counts.total}</div>
            <div className="text-xs text-slate-400 mt-1">Across all projects</div>
          </div>
        </div>

        {/* Pending / To Do */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              To Do
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{counts.todo}</div>
            <div className="text-xs text-slate-400 mt-1">Pending kickoff</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white">{counts.inProgress}</div>
            <div className="text-xs text-slate-400 mt-1">Currently being worked on</div>
          </div>
        </div>

        {/* Completed */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{counts.completed}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {counts.completionRate}% Done
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Finished tasks</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Tasks & Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks (Left 2 Columns) */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Recent Tasks</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest tasks in your workspace</p>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 group"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <EmptyState
                icon={ListTodo}
                title="No tasks created yet"
                description="Get started by creating your first task to track deliverables."
                actionLabel="Create Task"
                onAction={onOpenNewTask}
              />
            ) : (
              <div className="flex flex-col divide-y divide-slate-800/80">
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="py-3.5 flex items-center justify-between gap-3 group transition-colors hover:bg-slate-800/20 rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => toggleTaskStatus(task)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="overflow-hidden">
                        <p
                          className={`text-sm font-medium truncate ${
                            task.status === 'completed'
                              ? 'line-through text-slate-500'
                              : 'text-slate-200 group-hover:text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.project && (
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: `${task.project.color}20`,
                                color: task.project.color,
                                border: `1px solid ${task.project.color}40`,
                              }}
                            >
                              {task.project.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Progress Bar at Bottom of Recent Tasks */}
          {counts.total > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">Overall Workspace Completion</span>
                <span className="font-bold text-brand-400">{counts.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${counts.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Project Summaries (Right Column) */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Active Projects</h3>
                <p className="text-xs text-slate-400 mt-0.5">Progress by project</p>
              </div>
              <Link
                to="/projects"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Organize your tasks into structured projects."
                actionLabel="Create Project"
                onAction={onOpenNewProject}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-sm font-bold text-slate-200 truncate">
                          {project.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-300">
                        {project.progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: project.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{project.totalTasks} total tasks</span>
                      <span>{project.completedTasks} completed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Distribution Summary */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
              Task Priority Distribution
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-lg font-bold text-rose-400">{priorities.high}</div>
                <div className="text-[10px] text-slate-400 uppercase">High</div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="text-lg font-bold text-purple-400">{priorities.medium}</div>
                <div className="text-[10px] text-slate-400 uppercase">Medium</div>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <div className="text-lg font-bold text-teal-400">{priorities.low}</div>
                <div className="text-[10px] text-slate-400 uppercase">Low</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
