import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { projectService } from '../../services/projectService';
import { useToast } from '../../context/ToastContext';

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#eab308', // Yellow
  '#64748b', // Slate
];

const ProjectModal = ({
  isOpen,
  onClose,
  projectToEdit = null,
  onProjectSaved,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#10b981',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name || '',
        description: projectToEdit.description || '',
        color: projectToEdit.color || '#10b981',
        status: projectToEdit.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#10b981',
        status: 'active',
      });
    }
    setError('');
  }, [projectToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        status: formData.status,
      };

      if (projectToEdit) {
        await projectService.updateProject(projectToEdit._id, payload);
        showToast('Project updated successfully', 'success');
      } else {
        await projectService.createProject(payload);
        showToast('Project created successfully', 'success');
      }

      if (onProjectSaved) onProjectSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save project');
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'Create New Project'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Project Name *"
          name="name"
          placeholder="e.g. Website Redesign v2"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Description
          </label>
          <textarea
            name="description"
            rows="2"
            placeholder="Brief project goal or scope..."
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 hover:border-slate-700"
          />
        </div>

        {/* Color Palette Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Theme Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color: c }))}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                  formData.color === c
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        {projectToEdit && (
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {projectToEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
