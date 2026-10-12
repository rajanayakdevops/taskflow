import React from 'react';

const Select = ({
  label,
  error,
  options = [],
  value,
  onChange,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 ${
          error
            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40'
            : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/40 hover:border-slate-700'
        } ${className}`}
        {...props}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
              {opt.label}
            </option>
          ))}
      </select>
      {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
    </div>
  );
};

export default Select;
