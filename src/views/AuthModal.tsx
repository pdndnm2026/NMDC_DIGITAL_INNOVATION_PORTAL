import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PortalLoginPage } from './PortalLoginPage.js';
import { User } from '../types/index.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register-exec' | 'register-vendor';
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [notice] = useState<string>('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-slate-800/80 text-white hover:bg-slate-700"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
        {notice && (
          <div className="p-3 bg-blue-50 text-blue-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}
        <PortalLoginPage
          onLoginSuccess={(u) => {
            onLoginSuccess(u);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
