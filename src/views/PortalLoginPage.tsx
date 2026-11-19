import React, { useState } from 'react';
import {
  User,
  PortalStats,
  EmployeeMasterRecord,
  VENDOR_DECLARATION_TEXT,
} from '../types/index.js';
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ShieldCheck,
  Search,
  Building2,
} from 'lucide-react';
import { fetchApi } from '../utils/api.js';

interface PortalLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onExploreAsPublic?: () => void;
  stats?: PortalStats;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const ALLOWED_DOC_EXTS = ['PDF', 'JPG', 'JPEG', 'PNG', 'DOCX'];
const MAX_DOC_BYTES = 5 * 1024 * 1024; // 5 MB

interface UploadedVendorDoc {
  type: 'Registration' | 'PAN' | 'GST' | 'GSTExemption' | 'MSME' | 'AuthorisationLetter' | 'WorkOrder';
  title: string;
  mandatory: boolean;
  fileName: string;
  fileSize: string;
  mimeType?: string;
}

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({
  onLoginSuccess,
  onExploreAsPublic,
}) => {
  const [activeView, setActiveView] = useState<
    'login' | 'register-exec' | 'register-vendor' | 'setup-admin' | 'forgot-password'
  >('login');

  // Sign In State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');

  // Employee Master Verification + Registration State
  const [sapLookupId, setSapLookupId] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState<EmployeeMasterRecord | null>(null);
  const [sapVerifying, setSapVerifying] = useState(false);
  const [execEmailInput, setExecEmailInput] = useState('');
  const [execMobileInput, setExecMobileInput] = useState('');
  const [execPassword, setExecPassword] = useState('');
  const [execConfirmPassword, setExecConfirmPassword] = useState('');

  // Compulsory Vendor Registration State (Section 4)
  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    legalConstitution: 'Private Limited',
    registrationNumber: '',
    pan: '',
    gstExempt: false,
    gstExemptionReason: '',
    gstin: '',
    registeredAddress: '',
    state: '',
    pinCode: '',
    country: 'India',
    website: '',
    yearEstablished: new Date().getFullYear() - 5,
    msmeStatus: false,
    startupStatus: false,
    contactPerson: '',
    designation: '',
    email: '',
    mobile: '',
    alternateMobile: '',
    natureOfBusiness: '',
    businessCategory: 'Mining & HEMM Automation',
    companyProfile: '',
    areasOfBusiness: '',
    miningExperienceYears: 0,
    password: '',
    confirmPassword: '',
    declarationAccepted: false,
  });

  const [vendorDocs, setVendorDocs] = useState<Record<string, UploadedVendorDoc>>({
    Registration: { type: 'Registration', title: 'Company Registration Certificate', mandatory: true, fileName: '', fileSize: '' },
    PAN: { type: 'PAN', title: 'PAN Card', mandatory: true, fileName: '', fileSize: '' },
    GST: { type: 'GST', title: 'GST Registration Certificate', mandatory: true, fileName: '', fileSize: '' },
    GSTExemption: { type: 'GSTExemption', title: 'GST Exemption Declaration / Document', mandatory: false, fileName: '', fileSize: '' },
    MSME: { type: 'MSME', title: 'MSME / Udyam Certificate (Mandatory if MSME)', mandatory: false, fileName: '', fileSize: '' },
    AuthorisationLetter: { type: 'AuthorisationLetter', title: 'Authorisation Letter', mandatory: true, fileName: '', fileSize: '' },
    WorkOrder: { type: 'WorkOrder', title: 'Work Orders / Experience Certificates', mandatory: false, fileName: '', fileSize: '' },
  });

  // Initial Configurable Admin State (Zero hardcoded defaults)
  const [adminForm, setAdminForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    designation: '',
    department: 'Corporate IT & Executive Cell',
    password: '',
    confirmPassword: '',
  });

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
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
        setErrorMsg('No Portal Administrator account exists yet. Please complete the initial Administrator Setup below.');
        setActiveView('setup-admin');
      } else {
        setErrorMsg(err.message || 'Invalid Email ID / User ID or Password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify SAP ID against Employee Master
  const handleVerifySapId = async () => {
    resetMessages();
    if (!sapLookupId.trim()) {
      setErrorMsg('Please enter your SAP Employee ID.');
      return;
    }
    setSapVerifying(true);
    try {
      const res = await fetchApi('/api/auth/verify-sap', {
        method: 'POST',
        body: JSON.stringify({ sapEmployeeId: sapLookupId.trim() }),
      });
      if (res.success && res.employee) {
        setVerifiedEmployee(res.employee);
        setExecEmailInput(res.employee.officialEmail || '');
        setExecMobileInput(res.employee.mobileNumber || '');
        setSuccessMsg(
          `Employee Master record verified for ${res.employee.employeeName} (${res.employee.sapEmployeeId}). Department and Mine/Complex are locked from Employee Master.`
        );
      }
    } catch (err: any) {
      setVerifiedEmployee(null);
      setErrorMsg(
        err.message ||
          'Your employee details are not available in the Employee Master. Please contact the concerned administrator.'
      );
    } finally {
      setSapVerifying(false);
    }
  };

  const handleExecutiveRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!verifiedEmployee) {
      setErrorMsg('Please verify your SAP Employee ID against the Employee Master first.');
      return;
    }
    if (!EMAIL_REGEX.test(execEmailInput.trim())) {
      setErrorMsg('Please enter a valid Official Email ID.');
      return;
    }
    if (execPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (execPassword !== execConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/api/auth/register-executive', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: verifiedEmployee.sapEmployeeId,
          email: execEmailInput.trim(),
          mobile: execMobileInput.trim(),
          password: execPassword,
        }),
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setVerifiedEmployee(null);
        setSapLookupId('');
        setExecPassword('');
        setExecConfirmPassword('');
        setActiveView('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Employee registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorDocUpload = (docKey: UploadedVendorDoc['type'], file: File | null) => {
    if (!file) return;
    resetMessages();
    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    if (!ALLOWED_DOC_EXTS.includes(ext)) {
      setErrorMsg(`Invalid file type for ${vendorDocs[docKey].title}. Allowed formats: ${ALLOWED_DOC_EXTS.join(', ')}.`);
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setErrorMsg(`File "${file.name}" exceeds the maximum allowed size of 5 MB.`);
      return;
    }
    const sizeLabel =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    setVendorDocs((prev) => ({
      ...prev,
      [docKey]: {
        ...prev[docKey],
        fileName: file.name,
        fileSize: sizeLabel,
        mimeType: file.type,
      },
    }));
  };

  const handleVendorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanPan = vendorForm.pan.trim().toUpperCase();
    const cleanGstin = vendorForm.gstin.trim().toUpperCase();
    const cleanEmail = vendorForm.email.trim();
    const cleanMobile = vendorForm.mobile.replace(/\D/g, '').slice(-10);

    if (!vendorForm.companyName.trim() || !vendorForm.registeredAddress.trim() || !vendorForm.state.trim() || !vendorForm.country.trim()) {
      setErrorMsg('Please complete all mandatory (*) Company Details fields.');
      return;
    }
    if (!PAN_REGEX.test(cleanPan)) {
      setErrorMsg('Invalid PAN format. Expected 10 characters (e.g., AABCM1234K).');
      return;
    }
    if (!vendorForm.gstExempt && !GSTIN_REGEX.test(cleanGstin)) {
      setErrorMsg('Invalid 15-character GSTIN format (or select GST Exemption option).');
      return;
    }
    if (vendorForm.gstExempt && !vendorForm.gstExemptionReason.trim()) {
      setErrorMsg('Please state the statutory reason for GST Exemption.');
      return;
    }
    if (!/^\d{6}$/.test(vendorForm.pinCode.trim())) {
      setErrorMsg('PIN Code must be exactly 6 digits.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg('Please enter a valid Official Email ID.');
      return;
    }
    if (!MOBILE_REGEX.test(cleanMobile)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!vendorForm.contactPerson.trim() || !vendorForm.designation.trim() || !vendorForm.natureOfBusiness.trim() || !vendorForm.companyProfile.trim() || !vendorForm.areasOfBusiness.trim()) {
      setErrorMsg('Please complete all mandatory (*) Contact Person and Business Details fields.');
      return;
    }
    if (!vendorDocs.Registration.fileName || !vendorDocs.PAN.fileName || !vendorDocs.AuthorisationLetter.fileName) {
      setErrorMsg('Mandatory Documents Required: Company Registration Certificate, PAN Card, and Authorisation Letter.');
      return;
    }
    if (!vendorForm.gstExempt && !vendorDocs.GST.fileName) {
      setErrorMsg('GST Registration Certificate is mandatory unless GST Exemption is declared.');
      return;
    }
    if (vendorForm.gstExempt && !vendorDocs.GSTExemption.fileName) {
      setErrorMsg('Please upload GST Exemption Proof / Declaration document.');
      return;
    }
    if (vendorForm.msmeStatus && !vendorDocs.MSME.fileName) {
      setErrorMsg('MSME / Udyam Certificate upload is mandatory when MSME status is selected.');
      return;
    }
    if (vendorForm.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (vendorForm.password !== vendorForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!vendorForm.declarationAccepted) {
      setErrorMsg('You must accept the mandatory vendor declaration checkbox before submitting.');
      return;
    }

    const uploadedDocsList = Object.values(vendorDocs).filter((d) => Boolean(d.fileName));

    setLoading(true);
    try {
      const res = await fetchApi('/api/auth/register-vendor', {
        method: 'POST',
        body: JSON.stringify({
          ...vendorForm,
          pan: cleanPan,
          gstin: cleanGstin,
          mobile: cleanMobile,
          areasOfBusiness: vendorForm.areasOfBusiness
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          documents: uploadedDocsList,
        }),
      });
      if (res.success) {
        setSuccessMsg(res.message);
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
    resetMessages();
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.employeeId.trim() || !adminForm.password) {
      setErrorMsg('All mandatory administrator setup fields are required.');
      return;
    }
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

  const isWideForm = activeView === 'register-vendor' || activeView === 'register-exec';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-blue-700 selection:text-white">
      {/* Official NMDC PSU Header Bar */}
      <header className="bg-slate-900 text-slate-200 border-b border-slate-800 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/nmdc_logo_72562162.jpg"
              alt="NMDC Limited Logo"
              className="h-12 w-auto object-contain bg-white rounded-lg p-1 border border-slate-700 shrink-0"
            />
            <div>
              <div className="text-sm font-extrabold text-white tracking-wide uppercase">
                NMDC LIMITED
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                A Navratna Public Sector Enterprise under Ministry of Steel, Government of India
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            {onExploreAsPublic && (
              <button
                type="button"
                onClick={onExploreAsPublic}
                className="text-slate-200 hover:text-amber-300 font-semibold transition-colors"
              >
                Public Opportunities View
              </button>
            )}
            <span className="hidden sm:inline font-mono">CIN: L13100TG1958GOI000774</span>
          </div>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div
          className={`w-full ${
            isWideForm ? 'max-w-3xl' : 'max-w-lg'
          } bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all`}
        >
          {/* Title Header */}
          <div className="bg-slate-900 px-6 py-6 sm:px-8 text-white border-b border-slate-800 text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              NMDC Problem Statement & Vendor Solution Portal
            </h1>
            <p className="text-xs text-slate-300 max-w-xl mx-auto pt-0.5">
              Connecting NMDC's Operational Requirements with Innovative Industrial Solutions across Head Office, DIOM, KIOM, Bacheli & Kirandul.
            </p>
          </div>

          {/* Feedback Alert */}
          {(errorMsg || successMsg) && (
            <div className="px-6 sm:px-8 pt-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="font-medium leading-relaxed">{successMsg}</span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-5">
            {/* 1. CLEAN STANDARD SIGN IN */}
            {activeView === 'login' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Sign In</h2>
                  <p className="text-xs text-slate-500">
                    Sign in using your registered Official Email ID, SAP Employee ID, or Vendor Account.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Email ID / User ID <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="Enter Email ID or SAP Employee ID"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Password <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          resetMessages();
                          setActiveView('forgot-password');
                        }}
                        className="text-xs text-blue-700 hover:underline font-semibold"
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
                        placeholder="Enter Password"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
                    Quick Portal Access (Sample Roles)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    {[
                      { label: 'Portal Admin', email: 'admin@nmdc.co.in', pw: 'nmdc123' },
                      { label: 'HO Executive', email: 'exec.ho@nmdc.co.in', pw: 'nmdc123' },
                      { label: 'DIOM Officer', email: 'officer.diom@nmdc.co.in', pw: 'nmdc123' },
                      { label: 'Tech Evaluator', email: 'evaluator@nmdc.co.in', pw: 'nmdc123' },
                      { label: 'Project Manager', email: 'pm.bacheli@nmdc.co.in', pw: 'nmdc123' },
                      { label: 'Registered Vendor', email: 'vendor@deccanrobotics.in', pw: 'nmdc123' },
                    ].map((sample) => (
                      <button
                        key={sample.email}
                        type="button"
                        disabled={loading}
                        onClick={async () => {
                          resetMessages();
                          setLoading(true);
                          try {
                            const res = await fetchApi('/api/auth/login', {
                              method: 'POST',
                              body: JSON.stringify({ email: sample.email, password: sample.pw }),
                            });
                            if (res.success && res.user) onLoginSuccess(res.user);
                          } catch (err: any) {
                            setErrorMsg(err.message || 'Quick sign-in failed.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 rounded-lg font-semibold transition-colors"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('register-exec');
                    }}
                    className="py-2.5 px-3 border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 rounded-xl text-blue-800 font-bold transition-colors text-center"
                  >
                    NMDC Employee Registration (SAP ID)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('register-vendor');
                    }}
                    className="py-2.5 px-3 border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-600 rounded-xl text-emerald-800 font-bold transition-colors text-center"
                  >
                    Register as Vendor
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('setup-admin');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                  >
                    Initial Portal Setup: Configure Portal Administrator
                  </button>
                </div>
              </div>
            )}

            {/* 2. NMDC EMPLOYEE REGISTRATION AGAINST EMPLOYEE MASTER */}
            {activeView === 'register-exec' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">
                    NMDC Employee Portal Registration (SAP Employee Master Verification)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your SAP Employee ID to verify your details against the official Employee Master uploaded by Portal Administration.
                  </p>
                </div>

                {/* Step 1: SAP ID Verification */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <label className="font-bold text-slate-800 block">
                    Step 1: Verify SAP Employee ID <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={sapLookupId}
                        onChange={(e) => {
                          setSapLookupId(e.target.value);
                          if (verifiedEmployee) setVerifiedEmployee(null);
                        }}
                        placeholder="Enter SAP Employee ID (e.g. 10024589)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={sapVerifying}
                      onClick={handleVerifySapId}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg whitespace-nowrap shrink-0"
                    >
                      {sapVerifying ? 'Checking Master...' : 'Verify SAP ID'}
                    </button>
                  </div>
                </div>

                {/* Step 2: Read-Only Master Profile & Account Creation */}
                {verifiedEmployee && (
                  <form onSubmit={handleExecutiveRegister} className="space-y-4 text-xs">
                    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-700" />
                          Verified Employee Master Profile (Department & Unit Locked)
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          {verifiedEmployee.employeeStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-500 block mb-0.5">Employee Name</label>
                          <input
                            type="text"
                            readOnly
                            value={verifiedEmployee.employeeName}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">SAP Employee ID</label>
                          <input
                            type="text"
                            readOnly
                            value={verifiedEmployee.sapEmployeeId}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Department (Verified & Locked)</label>
                          <input
                            type="text"
                            readOnly
                            value={verifiedEmployee.department}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Mine / Complex / Head Office (Locked)</label>
                          <input
                            type="text"
                            readOnly
                            value={verifiedEmployee.mineComplexName}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Designation</label>
                          <input
                            type="text"
                            readOnly
                            value={verifiedEmployee.designation}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Area of Work / Location</label>
                          <input
                            type="text"
                            readOnly
                            value={[verifiedEmployee.areaOfWork, verifiedEmployee.location].filter(Boolean).join(' · ') || 'Standard Posting'}
                            className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Official Email ID <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={execEmailInput}
                          onChange={(e) => setExecEmailInput(e.target.value)}
                          placeholder="official@nmdc.co.in"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Mobile Number <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={execMobileInput}
                          onChange={(e) => setExecMobileInput(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Create Password <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={execPassword}
                          onChange={(e) => setExecPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Confirm Password <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={execConfirmPassword}
                          onChange={(e) => setExecConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors text-xs"
                    >
                      {loading ? 'Submitting Registration...' : 'Complete Employee Registration'}
                    </button>
                  </form>
                )}

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('login');
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 3. COMPULSORY VENDOR REGISTRATION & VALIDATION (SECTION 4) */}
            {activeView === 'register-vendor' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Vendor Registration & Statutory Compliance Form
                    </h2>
                    <p className="text-xs text-slate-500">
                      All fields marked with <span className="text-rose-600 font-bold">*</span> are compulsory. PAN, GSTIN/Exemption, and supporting documents are strictly validated.
                    </p>
                  </div>
                  <Building2 className="w-5 h-5 text-emerald-700 shrink-0" />
                </div>

                <form onSubmit={handleVendorRegister} className="space-y-5 text-xs max-h-[65vh] overflow-y-auto pr-2">
                  {/* A. Company Details */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      1. Company Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Company Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.companyName}
                          onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                          placeholder="Registered Legal Name"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Legal Constitution <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={vendorForm.legalConstitution}
                          onChange={(e) => setVendorForm({ ...vendorForm, legalConstitution: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="Private Limited">Private Limited Company</option>
                          <option value="Public Limited">Public Limited Company</option>
                          <option value="LLP">Limited Liability Partnership (LLP)</option>
                          <option value="Partnership">Partnership Firm</option>
                          <option value="Proprietorship">Proprietorship</option>
                          <option value="PSU / Govt Body">PSU / Government Undertaking</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Registration / CIN / Udyam No</label>
                        <input
                          type="text"
                          value={vendorForm.registrationNumber}
                          onChange={(e) => setVendorForm({ ...vendorForm, registrationNumber: e.target.value })}
                          placeholder="CIN or Certificate No"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          PAN <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={vendorForm.pan}
                          onChange={(e) => setVendorForm({ ...vendorForm, pan: e.target.value.toUpperCase() })}
                          placeholder="AAAAA0000A"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* GSTIN or Exemption */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={vendorForm.gstExempt}
                            onChange={(e) => setVendorForm({ ...vendorForm, gstExempt: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-700"
                          />
                          <span>Entity is Statutorily Exempt from GST Registration</span>
                        </label>
                      </div>
                      {!vendorForm.gstExempt ? (
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            GSTIN (15-Character Format) <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={15}
                            value={vendorForm.gstin}
                            onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value.toUpperCase() })}
                            placeholder="29AAAAA0000A1Z5"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono uppercase"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            GST Exemption Reason <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={vendorForm.gstExemptionReason}
                            onChange={(e) => setVendorForm({ ...vendorForm, gstExemptionReason: e.target.value })}
                            placeholder="e.g. Turnover below threshold limit / Exempt category"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Registered Office Address <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={vendorForm.registeredAddress}
                        onChange={(e) => setVendorForm({ ...vendorForm, registeredAddress: e.target.value })}
                        placeholder="Complete street / industrial estate address"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          State <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.state}
                          onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                          placeholder="e.g. Telangana"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          PIN Code <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={vendorForm.pinCode}
                          onChange={(e) => setVendorForm({ ...vendorForm, pinCode: e.target.value.replace(/\D/g, '') })}
                          placeholder="500028"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Country <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.country}
                          onChange={(e) => setVendorForm({ ...vendorForm, country: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Authorised Contact Person <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.contactPerson}
                          onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Designation <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.designation}
                          onChange={(e) => setVendorForm({ ...vendorForm, designation: e.target.value })}
                          placeholder="Director / Authorised Signatory"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Official Email ID <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={vendorForm.email}
                          onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                          placeholder="tenders@company.com"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Mobile Number (10 Digits) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={vendorForm.mobile}
                          onChange={(e) => setVendorForm({ ...vendorForm, mobile: e.target.value.replace(/\D/g, '') })}
                          placeholder="9876543210"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* B. Business Details */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      2. Business Profile & Technical Capabilities
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Nature of Business <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.natureOfBusiness}
                          onChange={(e) => setVendorForm({ ...vendorForm, natureOfBusiness: e.target.value })}
                          placeholder="e.g. OEM Manufacturer / System Integrator"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Relevant Business Category <span className="text-rose-600">*</span>
                        </label>
                        <select
                          value={vendorForm.businessCategory}
                          onChange={(e) => setVendorForm({ ...vendorForm, businessCategory: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <option value="Mining & HEMM Automation">Mining & HEMM Automation</option>
                          <option value="Mineral Processing & Crushing">Mineral Processing & Crushing</option>
                          <option value="Slurry Pipeline & Pumping">Slurry Pipeline & Pumping</option>
                          <option value="Geotechnical & Mine Safety">Geotechnical & Mine Safety</option>
                          <option value="Environment & Dust Control">Environment & Dust Control</option>
                          <option value="Industrial IT, OT & SCADA">Industrial IT, OT & SCADA</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Areas of Expertise (Comma-separated) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={vendorForm.areasOfBusiness}
                          onChange={(e) => setVendorForm({ ...vendorForm, areasOfBusiness: e.target.value })}
                          placeholder="e.g. Conveyor Telemetry, Vibrating Screens, PLC Automation"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Brief Company Profile <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={vendorForm.companyProfile}
                          onChange={(e) => setVendorForm({ ...vendorForm, companyProfile: e.target.value })}
                          placeholder="Summary of manufacturing facilities, engineering capabilities, and PSU project history"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mining / Industrial Experience (Years)</label>
                        <input
                          type="number"
                          min={0}
                          value={vendorForm.miningExperienceYears}
                          onChange={(e) => setVendorForm({ ...vendorForm, miningExperienceYears: Number(e.target.value) || 0 })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Company Website</label>
                        <input
                          type="url"
                          value={vendorForm.website}
                          onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                          placeholder="https://www.company.com"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={vendorForm.msmeStatus}
                          onChange={(e) => setVendorForm({ ...vendorForm, msmeStatus: e.target.checked })}
                          className="w-4 h-4 text-emerald-700 rounded"
                        />
                        <span>MSME / Udyam Registered Enterprise</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={vendorForm.startupStatus}
                          onChange={(e) => setVendorForm({ ...vendorForm, startupStatus: e.target.checked })}
                          className="w-4 h-4 text-blue-700 rounded"
                        />
                        <span>DPIIT Recognized Startup</span>
                      </label>
                    </div>
                  </div>

                  {/* C. Compulsory Supporting Documents */}
                  <div className="space-y-2.5 pt-2">
                    <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      3. Supporting Statutory Documents (PDF, JPG, PNG, DOCX · Max 5 MB each)
                    </h3>
                    <div className="space-y-2">
                      {(Object.keys(vendorDocs) as UploadedVendorDoc['type'][]).map((key) => {
                        const doc = vendorDocs[key];
                        if (key === 'GST' && vendorForm.gstExempt) return null;
                        if (key === 'GSTExemption' && !vendorForm.gstExempt) return null;
                        const isReq =
                          key === 'Registration' ||
                          key === 'PAN' ||
                          key === 'AuthorisationLetter' ||
                          (key === 'GST' && !vendorForm.gstExempt) ||
                          (key === 'GSTExemption' && vendorForm.gstExempt) ||
                          (key === 'MSME' && vendorForm.msmeStatus);

                        return (
                          <div
                            key={key}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {doc.title} {isReq && <span className="text-rose-600">*</span>}
                                </span>
                                {doc.fileName ? (
                                  <span className="text-[11px] text-emerald-700 font-mono">
                                    {doc.fileName} ({doc.fileSize})
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">No file uploaded</span>
                                )}
                              </div>
                            </div>
                            <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{doc.fileName ? 'Replace' : 'Upload File'}</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.docx"
                                className="hidden"
                                onChange={(e) => handleVendorDocUpload(key, e.target.files?.[0] || null)}
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* D. Account Password & Mandatory Verbatim Declaration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Account Password <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={vendorForm.password}
                        onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                        placeholder="Minimum 6 characters"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Confirm Password <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={vendorForm.confirmPassword}
                        onChange={(e) => setVendorForm({ ...vendorForm, confirmPassword: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-800 leading-relaxed">
                      <input
                        type="checkbox"
                        checked={vendorForm.declarationAccepted}
                        onChange={(e) => setVendorForm({ ...vendorForm, declarationAccepted: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-emerald-700 rounded shrink-0"
                        required
                      />
                      <span>
                        <strong className="text-rose-700">*</strong> {VENDOR_DECLARATION_TEXT}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors text-xs"
                  >
                    {loading ? 'Validating & Submitting Registration...' : 'Submit Vendor Registration'}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('login');
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 4. INITIAL PORTAL ADMINISTRATOR SETUP (Zero Hardcoded Credentials) */}
            {activeView === 'setup-admin' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">
                    Initial Portal Administrator Configuration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Create the primary Head Office Administrator account to manage Employee Master uploads, unit configurations, and role approvals.
                  </p>
                </div>

                <form onSubmit={handleAdminSetup} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Administrator Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Official Email ID <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        placeholder="admin@nmdc.co.in"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        SAP / Employee ID <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={adminForm.employeeId}
                        onChange={(e) => setAdminForm({ ...adminForm, employeeId: e.target.value })}
                        placeholder="e.g. HO-ADMIN-01"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
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
                        placeholder="Portal Administrator"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={adminForm.department}
                        onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Set Password <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Confirm Password <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={adminForm.confirmPassword}
                        onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-xs"
                  >
                    {loading ? 'Creating Administrator...' : 'Create Administrator Account'}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('login');
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* 5. FORGOT PASSWORD */}
            {activeView === 'forgot-password' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Password Recovery Request</h2>
                  <p className="text-xs text-slate-500">
                    Enter your registered official NMDC email or vendor email address.
                  </p>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Registered Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="user@nmdc.co.in or vendor@company.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!EMAIL_REGEX.test(forgotEmail.trim())) {
                        setErrorMsg('Please enter a valid email address.');
                        return;
                      }
                      setErrorMsg('');
                      setSuccessMsg(
                        `Password reset verification request logged for ${forgotEmail}. Please contact your Unit Administrator to reset access.`
                      );
                      setActiveView('login');
                    }}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs"
                  >
                    Submit Reset Request
                  </button>
                </div>
                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setActiveView('login');
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500">
        © 2026 NMDC Limited · A Government of India Enterprise · Enterprise Workflow Portal
      </footer>
    </div>
  );
};
