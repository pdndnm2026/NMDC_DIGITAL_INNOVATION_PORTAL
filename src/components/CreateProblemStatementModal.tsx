import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface CreateProblemStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProblemStatementModal: React.FC<CreateProblemStatementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Mining & HEMM Engineering');
  const [projectComplex, setProjectComplex] = useState('Bailadila Deposit 5 & 14 (Chhattisgarh)');
  const [category, setCategory] = useState('Predictive Maintenance');
  const [description, setDescription] = useState('');
  const [currentProcess, setCurrentProcess] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('2026-12-31');
  const [budgetNumeric, setBudgetNumeric] = useState<number>(3.0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi('/api/problems', {
        method: 'POST',
        body: JSON.stringify({
          title,
          department,
          projectComplex,
          category,
          problemDescription: description,
          currentProcess,
          expectedOutcome,
          submissionDeadline,
          budgetaryIndication: `₹ ${budgetNumeric.toFixed(2)} Cr`,
          budgetNumeric,
        }),
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(`Error publishing challenge: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Publish New NMDC Innovation Challenge
            </h3>
            <p className="text-slate-500 text-xs">Open a new problem statement for vendor technical offers.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Challenge Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI-Based Real-time HEMM Tyre Pressure & Tread Temperature Profiling"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-900"
              >
                <option value="Mining & HEMM Engineering">Mining & HEMM Engineering</option>
                <option value="Mine Planning & Production Operations">Mine Planning & Operations</option>
                <option value="Mine Safety & Environment">Mine Safety & Environment</option>
                <option value="Beneficiation & Pellet Plant">Beneficiation & Pellet Plant</option>
                <option value="Pipeline & Environment">Pipeline & Environment</option>
                <option value="Electrical & Power Systems">Electrical & Power Systems</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-900"
              >
                <option value="Predictive Maintenance">Predictive Maintenance</option>
                <option value="Fleet Management">Fleet Management</option>
                <option value="Safety">Safety & Collision Avoidance</option>
                <option value="Digital Twin">Digital Twin</option>
                <option value="Drone Technology">Drone Technology</option>
                <option value="Computer Vision">Computer Vision</option>
                <option value="Energy Management">Energy Management</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Project Complex</label>
              <input
                type="text"
                value={projectComplex}
                onChange={(e) => setProjectComplex(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Submission Deadline</label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Indicative Budget (₹ Crores)</label>
            <input
              type="number"
              step="0.1"
              value={budgetNumeric}
              onChange={(e) => setBudgetNumeric(parseFloat(e.target.value) || 1)}
              className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Detailed Problem Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the operational difficulties, current process, and site constraints..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Expected Technical Outcome & KPIs</label>
            <textarea
              rows={2}
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              placeholder="e.g. 15% reduction in MTTR, 85% predictive accuracy, and automated SCADA alert..."
              className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
            >
              {submitting ? 'Publishing...' : 'Publish Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
