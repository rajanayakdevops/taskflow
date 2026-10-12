import React from 'react';
import { Menu, Plus, FolderPlus, Search, Bell } from 'lucide-react';
import Button from '../common/Button';

const Navbar = ({
  onToggleSidebar,
  onOpenNewTask,
  onOpenNewProject,
  title = 'Dashboard',
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-100 hidden sm:block tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Button
          onClick={onOpenNewProject}
          variant="secondary"
          size="sm"
          icon={FolderPlus}
          className="hidden sm:inline-flex"
        >
          New Project
        </Button>

        <Button
          onClick={onOpenNewTask}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          New Task
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
