import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Kanban,
  List,
  Calendar,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  Check,
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import TaskModal from '../components/tasks/TaskModal';
import { TaskSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

const Tasks = () => {
  const { projects, refreshProjects } = useOutletContext();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectFilter) params.projectId = projectFilter;
      if (sortBy) params.sort = sortBy;

      const res = await taskService.getTasks(params);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, projectFilter, sortBy, showToast]);

  useEffect(() => {
    fetchTasks();

    const handleUpdate = () => fetchTasks();
    window.addEventListener('taskflow:task-updated', handleUpdate);
    return () => window.removeEventListener('taskflow:task-updated', handleUpdate);
  }, [fetchTasks]);

  const handleEditClick = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      setIsDeleting(true);
      await taskService.deleteTask(taskToDelete._id);
      showToast('Task deleted successfully', 'success');
      setTaskToDelete(null);
      fetchTasks();
      if (refreshProjects) refreshProjects();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await taskService.updateTask(taskId, { status: newStatus });
      showToast('Task status updated', 'success');
      if (refreshProjects) refreshProjects();
    } catch (err) {
      showToast(err.message || 'Failed to update task status', 'error');
      fetchTasks();
    }
  };

  // Group tasks for Kanban board
  const kanbanColumns = [
    { id: 'todo', title: 'To Do', color: 'border-slate-700' },
    { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/40' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500/40' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Task Management</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Create, prioritize, and track all your workflow tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            variant="primary"
            size="md"
            icon={Plus}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">All Projects</option>
            <option value="unassigned">Unassigned</option>
            {projects.map((proj) => (
              <option key={proj._id} value={proj._id}>
                {proj.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="createdAt">Newest First</option>
            <option value="dueDate">Due Date</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Content View Area */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={List}
          title="No tasks found"
          description={
            search || statusFilter || priorityFilter || projectFilter
              ? 'Try modifying your search or clearing active filters.'
              : 'You have not added any tasks yet. Create one to get started!'
          }
          actionLabel="Create Task"
          onAction={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
        />
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="glass-card divide-y divide-slate-800/80 overflow-hidden">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start gap-3.5 flex-1 overflow-hidden">
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() =>
                    handleStatusChange(
                      task._id,
                      task.status === 'completed' ? 'todo' : 'completed'
                    )
                  }
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold ${
                        task.status === 'completed'
                          ? 'line-through text-slate-500'
                          : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2.5 mt-2 flex-wrap">
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
                        Due {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />

                <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                  <button
                    onClick={() => handleEditClick(task)}
                    title="Edit Task"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTaskToDelete(task)}
                    title="Delete Task"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kanbanColumns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="glass-card p-4 flex flex-col gap-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{col.title}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Task Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No tasks in {col.title.toLowerCase()}
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task._id}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2.5 shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <PriorityBadge priority={task.priority} />
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditClick(task)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTaskToDelete(task)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-100 leading-snug">
                          {task.title}
                        </p>

                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                          {task.project ? (
                            <span
                              className="font-medium px-1.5 py-0.5 rounded truncate max-w-[120px]"
                              style={{
                                color: task.project.color,
                                backgroundColor: `${task.project.color}15`,
                              }}
                            >
                              {task.project.name}
                            </span>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}

                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Quick Kanban Move Buttons */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/50">
                          {col.id !== 'todo' && (
                            <button
                              onClick={() => handleStatusChange(task._id, 'todo')}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                            >
                              ← To Do
                            </button>
                          )}
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(task._id, 'in_progress')}
                              className="text-[10px] text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                            >
                              In Progress
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(task._id, 'completed')}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
                            >
                              Completed →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        projects={projects}
        onTaskSaved={() => {
          fetchTasks();
          if (refreshProjects) refreshProjects();
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete{' '}
            <span className="font-bold text-white">"{taskToDelete?.title}"</span>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setTaskToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
