import React, { useState } from 'react';
import { User, MineComplexCode, AUTHORIZED_MINE_COMPLEXES } from '../types/index.js';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  ArrowRight,
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  Briefcase,
  FileText,
  Upload
} from 'lucide-react';
import { PortalStats } from '../types/index.js';
import { fetchApi } from '../utils/api.js';

interface PortalLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onExploreAsPublic?: () => void;
  stats?: PortalStats;
}

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({ 
  onLoginSuccess,
  onExploreAsPublic,
  stats
}) => {
  const [activeView, setActiveView] = useState<'login' | 'register-exec' | 'register-vendor' | 'setup-admin' | 'forgot-password'>('login');
  
  // Sign In State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Executive Registration State (Section 3A)
  const [execForm, setExecForm] = useState({
    name: '',
    employeeId: '',
    designation: '',
    department: '',
    mineComplexCode: 'DIOM' as MineComplexCode,
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  // Vendor Registration State (Section 3B)
  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    registrationNumber: '',
    pan: '',
    gstin: '',
    registeredAddress: '',
    contactPerson: '',
    designation: '',
    email: '',
    mobile: '',
    website: '',
    msmeStatus: false,
    areasOfBusiness: '',
    password: '',
    confirmPassword: '',
    documents: [
      { title: 'Company Registration', type: 'Registration', fileName: 'Certificate_of_Incorporation.pdf', fileSize: '1.4 MB' },
      { title: 'PAN Card', type: 'PAN', fileName: 'Company_PAN.pdf', fileSize: '850 KB' },
      { title: 'GST Registration', type: 'GST', fileName: 'GSTIN_Registration.pdf', fileSize: '920 KB' },
    ],
  });

  // Admin Setup State (Section 1)
  const [adminForm, setAdminForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    designation: '',
    department: 'Corporate IT & Executive Cell',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginId, password: loginPassword }),
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('NO_ADMIN_SETUP_REQUIRED')) {
        setErrorMsg('The portal database is currently empty. Please set up the initial Corporate Administrator account.');
        setActiveView('setup-admin');
      } else {
        setErrorMsg(err.message || 'Invalid User ID / Email or Password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExecutiveRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (execForm.password !== execForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/api/auth/register-executive', {
        method: 'POST',
        body: JSON.stringify(execForm),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Registration submitted successfully. Your account is pending verification and activation by the NMDC Portal Administrator.');
        setActiveView('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (vendorForm.password !== vendorForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/api/auth/register-vendor', {
        method: 'POST',
        body: JSON.stringify({
          ...vendorForm,
          areasOfBusiness: vendorForm.areasOfBusiness.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Vendor registration submitted successfully. Your account is pending verification and activation by the portal administrator.');
        setActiveView('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Vendor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (adminForm.password !== adminForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/api/auth/setup-admin', {
        method: 'POST',
        body: JSON.stringify(adminForm),
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Administrator setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-blue-700 selection:text-white">
      {/* Official NMDC PSU Header Bar */}
      <header className="bg-slate-900 text-slate-200 border-b border-slate-800 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex flex-col items-center justify-center font-black text-xs shadow-xs">
              <span>NMDC</span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-wide uppercase">
                NMDC LIMITED · राष्ट्रीय खनिज विकास निगम
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                A Navratna Public Sector Enterprise under Ministry of Steel, Government of India
              </div>
            </div>
          </div>

          <div className="hidden sm:block text-right text-xs text-slate-400">
            CIN: L13100TG1958GOI000774
          </div>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-900 p-6 sm:p-8 text-white border-b border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
              ENTERPRISE WORKFLOW PORTAL
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              NMDC Problem Statement & Vendor Solution Portal
            </h1>
            <p className="text-xs text-slate-300 max-w-md mx-auto pt-1">
              Operational requirement tracking, vendor solution evaluation and project execution for NMDC iron ore mining complexes.
            </p>
          </div>

          {/* Notification Messages */}
          <div className="px-6 sm:px-8 pt-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-medium leading-relaxed">{successMsg}</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* 1. SIGN IN VIEW */}
            {activeView === 'login' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Sign In to Your Account</h2>
                  <p className="text-xs text-slate-500">
                    Enter your registered official email or Employee ID / CIN and password.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email / User ID *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="e.g. employee@nmdc.co.in or vendor@company.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Password *</label>
                      <button
                        type="button"
                        onClick={() => setActiveView('forgot-password')}
                        className="text-[11px] text-blue-700 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setActiveView('register-exec');
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Register as NMDC Executive →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setActiveView('register-vendor');
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Register as Vendor →
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setActiveView('setup-admin');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline"
                  >
                    First-Time Setup: Create Initial Corporate Administrator
                  </button>
                </div>
              </div>
            )}

            {/* 2. NMDC EXECUTIVE REGISTRATION (Section 3A) */}
            {activeView === 'register-exec' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block font-mono">
                    EMPLOYEE ONBOARDING · SECTION 3A
                  </span>
                  <h2 className="text-base font-bold text-slate-900">NMDC Executive Registration</h2>
                  <p className="text-xs text-slate-500">
                    Create your official executive account. Registration will remain pending until verified and activated by the administrator.
                  </p>
                </div>

                <form onSubmit={handleExecutiveRegister} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={execForm.name}
                        onChange={(e) => setExecForm({ ...execForm, name: e.target.value })}
                        placeholder="e.g. Dr. Amitabh Verma"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Employee ID *</label>
                      <input
                        type="text"
                        value={execForm.employeeId}
                        onChange={(e) => setExecForm({ ...execForm, employeeId: e.target.value })}
                        placeholder="e.g. NMDC-4089"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Designation *</label>
                      <input
                        type="text"
                        value={execForm.designation}
                        onChange={(e) => setExecForm({ ...execForm, designation: e.target.value })}
                        placeholder="e.g. General Manager (Mining)"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department *</label>
                      <input
                        type="text"
                        value={execForm.department}
                        onChange={(e) => setExecForm({ ...execForm, department: e.target.value })}
                        placeholder="e.g. Mining & HEMM Engineering"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Mine / Complex Selection (Mandatory 4 options per Section 3A) */}
                  <div>
                    <label className="font-bold text-slate-900 block mb-1">Mine / Complex *</label>
                    <select
                      value={execForm.mineComplexCode}
                      onChange={(e) => setExecForm({ ...execForm, mineComplexCode: e.target.value as MineComplexCode })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-medium"
                      required
                    >
                      <option value="DIOM">1. DIOM - Donimalai Iron Ore Mine</option>
                      <option value="KIOM">2. KIOM - Kumaraswamy Iron Ore Mine</option>
                      <option value="BCH">3. Bacheli Complex</option>
                      <option value="KDL">4. Kirandul Complex</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Email ID *</label>
                      <input
                        type="email"
                        value={execForm.email}
                        onChange={(e) => setExecForm({ ...execForm, email: e.target.value })}
                        placeholder="officer@nmdc.co.in"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={execForm.mobile}
                        onChange={(e) => setExecForm({ ...execForm, mobile: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Password *</label>
                      <input
                        type="password"
                        value={execForm.password}
                        onChange={(e) => setExecForm({ ...execForm, password: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        value={execForm.confirmPassword}
                        onChange={(e) => setExecForm({ ...execForm, confirmPassword: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors text-xs"
                    >
                      {loading ? 'Submitting...' : 'Submit Executive Registration'}
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveView('login')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 3. VENDOR REGISTRATION (Section 3B) */}
            {activeView === 'register-vendor' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block font-mono">
                    PARTNER ONBOARDING · SECTION 3B
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Vendor Registration</h2>
                  <p className="text-xs text-slate-500">
                    Register your industrial company. Accounts must be verified and activated by the portal administrator before offer submission.
                  </p>
                </div>

                <form onSubmit={handleVendorRegister} className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
                      <input
                        type="text"
                        value={vendorForm.companyName}
                        onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                        placeholder="e.g. Apex GeoSpatial Pvt Ltd"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Registration / CIN *</label>
                      <input
                        type="text"
                        value={vendorForm.registrationNumber}
                        onChange={(e) => setVendorForm({ ...vendorForm, registrationNumber: e.target.value })}
                        placeholder="e.g. U14200KA2020PTC091823"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Company PAN *</label>
                      <input
                        type="text"
                        value={vendorForm.pan}
                        onChange={(e) => setVendorForm({ ...vendorForm, pan: e.target.value })}
                        placeholder="AAAAA0000A"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">GSTIN *</label>
                      <input
                        type="text"
                        value={vendorForm.gstin}
                        onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
                        placeholder="29AAAAA0000A1Z5"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Registered Address *</label>
                    <textarea
                      rows={2}
                      value={vendorForm.registeredAddress}
                      onChange={(e) => setVendorForm({ ...vendorForm, registeredAddress: e.target.value })}
                      placeholder="Complete physical office address..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Contact Person *</label>
                      <input
                        type="text"
                        value={vendorForm.contactPerson}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                        placeholder="Authorized Signatory Name"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Designation *</label>
                      <input
                        type="text"
                        value={vendorForm.designation}
                        onChange={(e) => setVendorForm({ ...vendorForm, designation: e.target.value })}
                        placeholder="e.g. Director / Managing Partner"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Email *</label>
                      <input
                        type="email"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                        placeholder="contact@company.com"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        value={vendorForm.mobile}
                        onChange={(e) => setVendorForm({ ...vendorForm, mobile: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Company Website</label>
                      <input
                        type="url"
                        value={vendorForm.website}
                        onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                        placeholder="https://www.company.com"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Areas of Business</label>
                      <input
                        type="text"
                        value={vendorForm.areasOfBusiness}
                        onChange={(e) => setVendorForm({ ...vendorForm, areasOfBusiness: e.target.value })}
                        placeholder="e.g. Mining Automation, Sensors, Radar"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">MSME Registration Status</span>
                      <span className="text-[11px] text-slate-500">Is your enterprise registered under Micro, Small & Medium Enterprises?</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={vendorForm.msmeStatus}
                        onChange={(e) => setVendorForm({ ...vendorForm, msmeStatus: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Yes (MSME)</span>
                    </label>
                  </div>

                  {/* Statutory Documents (Section 3B) */}
                  <div className="space-y-2 pt-1">
                    <span className="font-bold text-slate-800 block uppercase tracking-wider text-[11px]">
                      Mandatory Verification Documents
                    </span>
                    <div className="space-y-1.5">
                      {vendorForm.documents.map((doc, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="font-semibold text-slate-800 block">{doc.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{doc.fileName} ({doc.fileSize})</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            Uploaded
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Password *</label>
                      <input
                        type="password"
                        value={vendorForm.password}
                        onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        value={vendorForm.confirmPassword}
                        onChange={(e) => setVendorForm({ ...vendorForm, confirmPassword: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors text-xs"
                    >
                      {loading ? 'Submitting...' : 'Submit Vendor Registration'}
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveView('login')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 4. INITIAL ADMINISTRATOR SETUP (Section 1) */}
            {activeView === 'setup-admin' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest block font-mono">
                    PORTAL SETUP · SECTION 1
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Create Corporate Administrator</h2>
                  <p className="text-xs text-slate-500">
                    The database is currently empty. Set up your first real Corporate Administrator account to manage users, approvals, and mine modules.
                  </p>
                </div>

                <form onSubmit={handleAdminSetup} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Administrator Full Name *</label>
                    <input
                      type="text"
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      placeholder="e.g. Shri R. K. Sharma"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Official Email *</label>
                      <input
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        placeholder="admin@nmdc.co.in"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Employee ID *</label>
                      <input
                        type="text"
                        value={adminForm.employeeId}
                        onChange={(e) => setAdminForm({ ...adminForm, employeeId: e.target.value })}
                        placeholder="NMDC-CORP-ADMIN"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Designation</label>
                      <input
                        type="text"
                        value={adminForm.designation}
                        onChange={(e) => setAdminForm({ ...adminForm, designation: e.target.value })}
                        placeholder="Executive Director (Digital & IT)"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={adminForm.department}
                        readOnly
                        className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Set Password *</label>
                      <input
                        type="password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        value={adminForm.confirmPassword}
                        onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs transition-colors text-xs"
                    >
                      {loading ? 'Initializing Administrator...' : 'Create Administrator & Enter Portal'}
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveView('login')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 5. FORGOT PASSWORD VIEW */}
            {activeView === 'forgot-password' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Forgot Password</h2>
                  <p className="text-xs text-slate-500">
                    Enter your official NMDC email or registered vendor email.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Registered Email Address</label>
                    <input
                      type="email"
                      placeholder="user@nmdc.co.in or vendor@company.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMsg('Password reset instructions have been forwarded to the Corporate IT Security Officer.');
                      setActiveView('login');
                    }}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs"
                  >
                    Request Password Reset
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveView('login')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500">
        © 2026 NMDC Limited · A Government of India Enterprise · Confidential Enterprise Operational System
      </footer>
    </div>
  );
};
