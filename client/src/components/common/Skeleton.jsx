import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-card p-5 animate-pulse flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="h-4 bg-slate-800 rounded w-1/3" />
      <div className="h-4 bg-slate-800 rounded w-8" />
    </div>
    <div className="h-7 bg-slate-800 rounded w-1/2 mt-1" />
    <div className="h-3 bg-slate-800 rounded w-3/4 mt-2" />
  </div>
);

export const TaskSkeleton = () => (
  <div className="glass-card p-4 animate-pulse flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-5 h-5 bg-slate-800 rounded-md shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="h-3 bg-slate-800 rounded w-1/3" />
      </div>
    </div>
    <div className="h-6 bg-slate-800 rounded-full w-20" />
  </div>
);
