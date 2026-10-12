import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TaskModal from '../tasks/TaskModal';
import ProjectModal from '../projects/ProjectModal';
import { projectService } from '../../services/projectService';
import { Loader2 } from 'lucide-react';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  // Fetch user projects so they are available in task modals
  const fetchProjects = async () => {
    try {
      const res = await projectService.getProjects();
      if (res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      console.warn('Failed to load user projects for layout:', err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading TaskFlow...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Derive page title from pathname
  const getPageTitle = () => {
    if (location.pathname.startsWith('/tasks')) return 'Task Management';
    if (location.pathname.startsWith('/projects')) return 'Projects';
    return 'Dashboard Overview';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenNewTask={() => setTaskModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          title={getPageTitle()}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenNewTask={() => setTaskModalOpen(true)}
          onOpenNewProject={() => setProjectModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet
            context={{
              onOpenNewTask: () => setTaskModalOpen(true),
              onOpenNewProject: () => setProjectModalOpen(true),
              projects,
              refreshProjects: fetchProjects,
            }}
          />
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projects={projects}
        onTaskSaved={() => {
          fetchProjects();
          window.dispatchEvent(new CustomEvent('taskflow:task-updated'));
        }}
      />

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onProjectSaved={() => {
          fetchProjects();
          window.dispatchEvent(new CustomEvent('taskflow:project-updated'));
        }}
      />
    </div>
  );
};

export default ProtectedLayout;
