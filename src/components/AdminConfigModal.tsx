import React, { useState } from 'react';
import { EvaluationParameter } from '../types/index.js';
import { X, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: EvaluationParameter[];
  onUpdateParameters: (updated: EvaluationParameter[]) => void;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  parameters,
  onUpdateParameters,
}) => {
  const [localParams, setLocalParams] = useState<EvaluationParameter[]>([...parameters]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const totalWeight = localParams.reduce((acc, p) => acc + (p.weightPct || 0), 0);

  const handleWeightChange = (id: string, val: number) => {
    setLocalParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, weightPct: val } : p))
    );
  };

  const handleSave = async () => {
    if (totalWeight !== 100) {
      alert(`Weights must total exactly 100%. Currently: ${totalWeight}%`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetchApi('/api/evaluation-parameters', {
        method: 'PUT',
        body: JSON.stringify({ parameters: localParams }),
      });
      if (res.success && res.data) {
        onUpdateParameters(res.data);
        onClose();
      }
    } catch (e: any) {
      alert(`Error saving parameters: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Admin Configuration: Evaluation Parameters & Weights
            </h3>
            <p className="text-slate-500 text-xs">
              Configure the scoring algorithm weights across technical and commercial criteria.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className={`p-3 rounded-lg border flex items-center justify-between font-semibold ${
            totalWeight === 100
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <span>Total Weight Allocation:</span>
            <span className="font-mono text-sm">{totalWeight}% / 100%</span>
          </div>

          <div className="space-y-3">
            {localParams.map((param) => (
              <div key={param.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-xs">{param.name}</div>
                  <div className="text-[11px] text-slate-500">{param.type === 'technical' ? 'Technical Criterion' : 'Commercial Criterion'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={param.weightPct}
                    onChange={(e) => handleWeightChange(param.id, parseInt(e.target.value, 10) || 0)}
                    className="w-16 border border-slate-300 rounded px-2 py-1 text-center font-mono font-bold text-slate-900 bg-white"
                  />
                  <span className="font-bold text-slate-600">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};
