import React from 'react';
import {
  MineComplex,
  MineComplexCode,
  ProblemStatement,
  BudgetaryOfferRequest,
  Proposal,
  PocRecord,
  AwardOfWork,
  Project,
  User,
  UserRole,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import { Building2, MapPin, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface MineSelectionViewProps {
  organisationalUnits?: MineComplex[];
  activeComplexCode: MineComplexCode | 'ALL';
  onSelectComplex: (code: MineComplexCode | 'ALL') => void;
  onNavigateTab: (tab: string) => void;
  currentUser: User | null;
  currentRole: UserRole;
  problemStatements: ProblemStatement[];
  budgetaryRequests: BudgetaryOfferRequest[];
  proposals: Proposal[];
  pocs: PocRecord[];
  awards: AwardOfWork[];
  projects: Project[];
}

export const MineSelectionView: React.FC<MineSelectionViewProps> = ({
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  activeComplexCode,
  onSelectComplex,
  onNavigateTab,
  currentUser,
  currentRole,
  problemStatements,
  budgetaryRequests,
  proposals,
  pocs,
  awards,
  projects,
}) => {
  const hasCorporateAccess =
    currentRole === 'admin' ||
    currentRole === 'approving_authority' ||
    !currentUser?.mineComplexCode ||
    currentUser?.mineComplexCode === 'ALL' ||
    currentUser?.mineComplexCode === 'HO';

  const canAccessUnit = (code: MineComplexCode) => {
    if (hasCorporateAccess || currentRole === 'vendor' || currentRole === 'public') return true;
    return currentUser?.mineComplexCode === code;
  };

  return (
    <div className="space-y-6 pb-14">
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider">
            ORGANISATIONAL UNIT WORKSPACES · 5 REGISTERED UNITS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Mine / Complex & Head Office Selection
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Each NMDC unit maintains independent registers for Problem Statements, Budgetary Offer Requests, Vendor Responses, Clarifications, PoCs, Work Orders, and Project Monitoring.
          </p>
        </div>

        {hasCorporateAccess && (
          <button
            onClick={() => {
              onSelectComplex('ALL');
              onNavigateTab('dashboard');
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 ${
              activeComplexCode === 'ALL'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Consolidated All 5 Units</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organisationalUnits.map((unit) => {
          const allowed = canAccessUnit(unit.code);
          const isSelected = activeComplexCode === unit.code;
          const psCount = problemStatements.filter((p) => p.mineComplexCode === unit.code).length;
          const borCount = budgetaryRequests.filter((b) => b.mineComplexCode === unit.code).length;
          const propCount = proposals.filter((p) => p.mineComplexCode === unit.code).length;
          const pocCount = pocs.filter((p) => p.mineComplexCode === unit.code).length;
          const awardCount = awards.filter((a) => a.mineComplexCode === unit.code).length;
          const projCount = projects.filter((p) => p.mineComplexCode === unit.code).length;

          return (
            <div
              key={unit.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between space-y-4 ${
                isSelected ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200'
              } ${!allowed ? 'opacity-65 bg-slate-50' : ''}`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                    {unit.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {unit.unitType}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{unit.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{unit.location}, {unit.state}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Problems</span>
                    <strong className="font-mono tabular-nums text-slate-900">{psCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">BORs</span>
                    <strong className="font-mono tabular-nums text-slate-900">{borCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Responses</span>
                    <strong className="font-mono tabular-nums text-slate-900">{propCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PoCs</span>
                    <strong className="font-mono tabular-nums text-slate-900">{pocCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Awards</span>
                    <strong className="font-mono tabular-nums text-slate-900">{awardCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Projects</span>
                    <strong className="font-mono tabular-nums text-slate-900">{projCount}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400">{unit.prefix}XXXX</span>
                {allowed ? (
                  <button
                    onClick={() => {
                      onSelectComplex(unit.code);
                      onNavigateTab('dashboard');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-900 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{isSelected ? 'Active Dashboard' : 'Open Unit Dashboard'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Restricted to Assigned Unit
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
