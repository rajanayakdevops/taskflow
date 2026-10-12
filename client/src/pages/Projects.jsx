import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ProjectModal from '../components/projects/ProjectModal';
import { CardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

const Projects = () => {
  const { refreshProjects } = useOutletContext();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjectsList = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await projectService.getProjects(params);
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchProjectsList();

    const handleUpdate = () => fetchProjectsList();
    window.addEventListener('taskflow:project-updated', handleUpdate);
    window.addEventListener('taskflow:task-updated', handleUpdate);

    return () => {
      window.removeEventListener('taskflow:project-updated', handleUpdate);
      window.removeEventListener('taskflow:task-updated', handleUpdate);
    };
  }, [fetchProjectsList]);

  const handleEditClick = (project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await projectService.deleteProject(projectToDelete._id);
      showToast('Project and linked tasks deleted', 'success');
      setProjectToDelete(null);
      fetchProjectsList();
      if (refreshProjects) refreshProjects();
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Projects</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Organize workloads into projects, track completion rates, and manage timelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <Button
            onClick={() => {
              setProjectToEdit(null);
              setIsProjectModalOpen(true);
            }}
            variant="primary"
            size="md"
            icon={Plus}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create structured project initiatives to categorize and organize your team's tasks."
          actionLabel="Create Project"
          onAction={() => {
            setProjectToEdit(null);
            setIsProjectModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="glass-card-hover p-6 flex flex-col justify-between gap-5 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
                      style={{
                        backgroundColor: project.color,
                        boxShadow: `0 8px 16px ${project.color}30`,
                      }}
                    >
                      <FolderKanban className="w-5 h-5 text-white" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-base font-bold text-white truncate">
                        {project.name}
                      </h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(project)}
                      title="Edit Project"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(project)}
                      title="Delete Project"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Progress Bar & Stats */}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Completion</span>
                  <span className="font-bold text-slate-200">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{project.totalTasks} total tasks</span>
                  <span>{project.completedTasks} completed</span>
                </div>

                <div className="pt-2 mt-1">
                  <Link
                    to={`/tasks?project=${project._id}`}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center justify-between py-1 group/link"
                  >
                    <span>View Project Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-link-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal (Create & Edit) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projectToEdit={projectToEdit}
        onProjectSaved={() => {
          fetchProjectsList();
          if (refreshProjects) refreshProjects();
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete project{' '}
            <span className="font-bold text-white">"{projectToDelete?.name}"</span>?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            ⚠️ Warning: All tasks associated with this project will also be deleted permanently.
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setProjectToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;
