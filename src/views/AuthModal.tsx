import React, { useState } from 'react';
import { UserRole } from '../types/index.js';
import { X, ShieldCheck, Building2, User, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register-exec' | 'register-vendor';
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register-exec' | 'register-vendor'>(initialMode);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('executive');

  // Executive registration
  const [execName, setExecName] = useState('');
  const [execEmail, setExecEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Deputy General Manager');
  const [department, setDepartment] = useState('Mining & HEMM Engineering');
  const [projectComplex, setProjectComplex] = useState('Bailadila Deposit 5');

  // Vendor registration
  const [companyName, setCompanyName] = useState('');
  const [legalEntity, setLegalEntity] = useState('Private Limited');
  const [cin, setCin] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [msmeStatus, setMsmeStatus] = useState(true);
  const [startupStatus, setStartupStatus] = useState(true);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: selectedRole }),
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    }
  };

  const handleRegisterExec = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/api/auth/register-executive', {
        method: 'POST',
        body: JSON.stringify({
          name: execName,
          email: execEmail,
          employeeId,
          designation,
          department,
          projectComplex,
        }),
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/api/auth/register-vendor', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          legalEntity,
          cin: cin || 'U72900TG2024PTC192010',
          pan: pan || 'AABCV1029K',
          gstin: gstin || '36AABCV1029K1Z4',
          contactPerson,
          email: vendorEmail,
          msmeStatus,
          startupStatus,
        }),
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      alert(`Vendor registration failed: ${err.message}`);
    }
  };

  const fastPersonaLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; name: string }> = {
      public: { email: 'public@citizen.in', name: 'Public User' },
      executive: { email: 'executive@nmdc.co.in', name: 'Dr. Amitabh Verma (GM - Mining)' },
      vendor: { email: 'vendor@miningtech.in', name: 'Ananya Deshmukh (MiningTech)' },
      reviewer: { email: 'reviewer@nmdc.co.in', name: 'Shri S. K. Nayak (CGM - R&D)' },
      project_manager: { email: 'pm@nmdc.co.in', name: 'V. Rajeshwar Rao (DGM - Projects)' },
      admin: { email: 'admin@nmdc.co.in', name: 'Shri R. K. Sharma (ED - IT)' },
    };

    try {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: creds[role].email, role }),
      });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-blue-400 font-semibold tracking-wider">
              NMDC SECURE AUTHENTICATION GATEWAY
            </span>
            <h2 className="text-base font-bold text-slate-100">
              {mode === 'login' ? 'Portal Sign In' : mode === 'register-exec' ? 'Register as NMDC Executive' : 'Register as Technology Vendor'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register-exec')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'register-exec'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Executive Reg
          </button>
          <button
            onClick={() => setMode('register-vendor')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'register-vendor'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendor Reg
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 text-xs">
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Quick Persona Picker for instant evaluation */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <span className="font-bold text-blue-900 block mb-1.5 text-[11px]">
                  Fast Evaluation: 1-Click Sign In as:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fastPersonaLogin('executive')}
                    className="p-1.5 bg-white hover:bg-blue-100/60 border border-blue-200 rounded text-left font-medium text-blue-900 text-[11px] truncate"
                  >
                    👔 Executive (Dr. Verma)
                  </button>
                  <button
                    type="button"
                    onClick={() => fastPersonaLogin('vendor')}
                    className="p-1.5 bg-white hover:bg-blue-100/60 border border-blue-200 rounded text-left font-medium text-blue-900 text-[11px] truncate"
                  >
                    🏢 Vendor (MiningTech)
                  </button>
                  <button
                    type="button"
                    onClick={() => fastPersonaLogin('reviewer')}
                    className="p-1.5 bg-white hover:bg-blue-100/60 border border-blue-200 rounded text-left font-medium text-blue-900 text-[11px] truncate"
                  >
                    ⚖️ Reviewer (Shri Nayak)
                  </button>
                  <button
                    type="button"
                    onClick={() => fastPersonaLogin('admin')}
                    className="p-1.5 bg-white hover:bg-blue-100/60 border border-blue-200 rounded text-left font-medium text-blue-900 text-[11px] truncate"
                  >
                    🛡️ Admin (Shri Sharma)
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email / Employee ID / CIN</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. executive@nmdc.co.in or vendor@miningtech.in"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" className="text-blue-700 hover:underline">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
                >
                  Sign In to NMDC Portal
                </button>
              </form>
            </div>
          )}

          {mode === 'register-exec' && (
            <form onSubmit={handleRegisterExec} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={execName}
                  onChange={(e) => setExecName(e.target.value)}
                  placeholder="e.g. Shri Rajesh Kumar Sharma"
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={execEmail}
                    onChange={(e) => setExecEmail(e.target.value)}
                    placeholder="name@nmdc.co.in"
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="NMDC-CORP-XXXX"
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Project Complex</label>
                  <input
                    type="text"
                    value={projectComplex}
                    onChange={(e) => setProjectComplex(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs mt-2"
              >
                Register & Activate Account
              </button>
            </form>
          )}

          {mode === 'register-vendor' && (
            <form onSubmit={handleRegisterVendor} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Industrial AI Technologies Pvt Ltd"
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Legal Entity</label>
                  <select
                    value={legalEntity}
                    onChange={(e) => setLegalEntity(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 bg-white"
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CIN / Registration No</label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="U72900TG2020PTC..."
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="36AAACV1234F1Z9"
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PAN</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="AAACV1234F"
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Authorised Contact</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Full Name"
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={msmeStatus}
                    onChange={(e) => setMsmeStatus(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>MSME Registered</span>
                </label>
                <label className="flex items-center gap-1.5 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={startupStatus}
                    onChange={(e) => setStartupStatus(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>DPIIT Startup</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs mt-2"
              >
                Register Company Profile
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
