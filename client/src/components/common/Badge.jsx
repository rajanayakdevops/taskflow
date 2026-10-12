import React from 'react';

export const StatusBadge = ({ status }) => {
  const configs = {
    todo: {
      label: 'To Do',
      classes: 'bg-slate-800 text-slate-300 border-slate-700/80',
      dot: 'bg-slate-400',
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
      dot: 'bg-amber-400 animate-pulse',
    },
    completed: {
      label: 'Completed',
      classes: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40',
      dot: 'bg-emerald-400',
    },
  };

  const config = configs[status] || configs.todo;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const configs = {
    low: {
      label: 'Low',
      classes: 'bg-teal-950/50 text-teal-300 border-teal-600/30',
    },
    medium: {
      label: 'Medium',
      classes: 'bg-purple-950/50 text-purple-300 border-purple-600/30',
    },
    high: {
      label: 'High',
      classes: 'bg-rose-950/60 text-rose-300 border-rose-600/40',
    },
  };

  const config = configs[priority] || configs.medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${config.classes}`}
    >
      {config.label}
    </span>
  );
};
