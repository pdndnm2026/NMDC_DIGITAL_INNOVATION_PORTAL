import React, { useState, useEffect } from 'react';
import {
  DiscussionThread,
  ProblemStatement,
  BudgetaryOfferRequest,
  Vendor,
  AttachmentFile,
  User,
  UserRole,
  MineComplex,
  DEFAULT_ORGANISATIONAL_UNITS,
} from '../types/index.js';
import { fetchApi } from '../utils/api.js';
import {
  MessageSquare,
  PlusCircle,
  Lock,
  ShieldCheck,
  Send,
  Paperclip,
  Globe,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';

interface DiscussionsViewProps {
  discussions: DiscussionThread[];
  problemStatements: ProblemStatement[];
  budgetaryRequests: BudgetaryOfferRequest[];
  vendors: Vendor[];
  currentUser: User | null;
  currentRole: UserRole;
  organisationalUnits?: MineComplex[];
  preselectedEntity?: {
    type: 'PROBLEM' | 'BUDGETARY_REQUEST';
    id: string;
    code: string;
    title: string;
    mineComplexCode: string;
  } | null;
  onClearPreselected?: () => void;
  onRefreshData: () => void;
}

export const DiscussionsView: React.FC<DiscussionsViewProps> = ({
  discussions,
  problemStatements,
  budgetaryRequests,
  vendors,
  currentUser,
  currentRole,
  organisationalUnits = DEFAULT_ORGANISATIONAL_UNITS,
  preselectedEntity,
  onClearPreselected,
  onRefreshData,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<'ALL' | 'PROBLEM' | 'BUDGETARY_REQUEST'>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Reply composer
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start New Thread Modal
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [newLinkedType, setNewLinkedType] = useState<'PROBLEM' | 'BUDGETARY_REQUEST'>('PROBLEM');
  const [newLinkedId, setNewLinkedId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newIsCommonPublic, setNewIsCommonPublic] = useState(false);
  const [newTargetVendorId, setNewTargetVendorId] = useState('');
  const [newFirstMessage, setNewFirstMessage] = useState('');
  const [newAttachments, setNewAttachments] = useState<AttachmentFile[]>([]);

  const isVendor = currentRole === 'vendor';
  const isOfficer =
    currentRole === 'executive' ||
    currentRole === 'dept_head' ||
    currentRole === 'approving_authority' ||
    currentRole === 'tech_evaluator' ||
    currentRole === 'comm_evaluator' ||
    currentRole === 'poc_committee' ||
    currentRole === 'project_manager' ||
    currentRole === 'admin';

  useEffect(() => {
    if (preselectedEntity) {
      setNewLinkedType(preselectedEntity.type);
      setNewLinkedId(preselectedEntity.id);
      setNewThreadOpen(true);
      if (onClearPreselected) onClearPreselected();
    }
  }, [preselectedEntity]);

  // Strict vendor privacy enforcement on client list too
  const visibleThreads = discussions.filter((t) => {
    if (isVendor) {
      const vid = currentUser?.vendorId || '';
      if (!t.isCommonPublic && (!vid || t.vendorId !== vid)) return false;
    }
    if (entityTypeFilter !== 'ALL' && t.linkedEntityType !== entityTypeFilter) return false;
    if (unitFilter !== 'ALL' && t.mineComplexCode !== unitFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.threadCode.toLowerCase().includes(q) ||
        t.linkedEntityCode.toLowerCase().includes(q) ||
        (t.vendorName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeThread = visibleThreads.find((t) => t.id === selectedThreadId) || visibleThreads[0] || null;

  const handleSelectThread = async (t: DiscussionThread) => {
    setSelectedThreadId(t.id);
    const hasUnread = isVendor ? t.unreadByVendor > 0 : t.unreadByOfficer > 0;
    if (hasUnread) {
      try {
        await fetchApi(`/api/discussions/${t.id}/read`, {
          method: 'PATCH',
          body: JSON.stringify({ role: currentRole }),
        });
        onRefreshData();
      } catch {
        // ignore
      }
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>, target: 'reply' | 'new') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const mapped: AttachmentFile[] = files.map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      type: f.name.split('.').pop()?.toUpperCase() || 'FILE',
      mediaKind: f.type.startsWith('image/') ? 'image' : 'document',
    }));
    if (target === 'reply') {
      setReplyAttachments((prev) => [...prev, ...mapped]);
    } else {
      setNewAttachments((prev) => [...prev, ...mapped]);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const senderOrg = isVendor
        ? vendors.find((v) => v.id === currentUser?.vendorId)?.name || 'Registered Vendor'
        : `NMDC (${currentUser?.mineComplexCode || 'HO'})`;
      await fetchApi(`/api/discussions/${activeThread.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUser?.id || 'usr',
          senderName: currentUser?.name || 'User',
          senderOrganisation: senderOrg,
          senderRole: currentRole,
          messageText: replyText.trim(),
          attachments: replyAttachments,
          isOfficialClarification: activeThread.isCommonPublic,
        }),
      });
      setReplyText('');
      setReplyAttachments([]);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseThread = async (threadId: string) => {
    try {
      await fetchApi(`/api/discussions/${threadId}/close`, {
        method: 'PATCH',
        body: JSON.stringify({ closedBy: currentUser?.name || 'Authorized NMDC Officer' }),
      });
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to close discussion.');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newLinkedId || !newSubject.trim() || !newFirstMessage.trim()) {
      setErrorMsg('Please select a reference Problem Statement or BOR, subject, and message.');
      return;
    }

    const ps = newLinkedType === 'PROBLEM' ? problemStatements.find((p) => p.id === newLinkedId) : undefined;
    const bor = newLinkedType === 'BUDGETARY_REQUEST' ? budgetaryRequests.find((b) => b.id === newLinkedId) : undefined;
    const targetVendor = isVendor
      ? vendors.find((v) => v.id === currentUser?.vendorId)
      : vendors.find((v) => v.id === newTargetVendorId);

    const senderOrg = isVendor
      ? targetVendor?.name || 'Registered Vendor'
      : `NMDC (${ps?.mineComplexCode || bor?.mineComplexCode || 'HO'})`;

    try {
      const res = await fetchApi<{ success: boolean; data: DiscussionThread }>('/api/discussions', {
        method: 'POST',
        body: JSON.stringify({
          mineComplexCode: ps?.mineComplexCode || bor?.mineComplexCode || 'HO',
          linkedEntityType: newLinkedType,
          linkedEntityId: ps?.id || bor?.id || newLinkedId,
          linkedEntityCode: ps?.code || bor?.requestCode || newLinkedId,
          linkedEntityTitle: ps?.title || bor?.title || '',
          subject: newSubject.trim(),
          vendorId: newIsCommonPublic ? undefined : targetVendor?.id || currentUser?.vendorId,
          vendorName: newIsCommonPublic ? undefined : targetVendor?.name || currentUser?.name,
          isCommonPublic: isOfficer ? newIsCommonPublic : false,
          senderId: currentUser?.id || 'usr',
          senderName: currentUser?.name || 'User',
          senderOrganisation: senderOrg,
          senderRole: currentRole,
          messageText: newFirstMessage.trim(),
          attachments: newAttachments,
        }),
      });
      setNewThreadOpen(false);
      setNewSubject('');
      setNewFirstMessage('');
      setNewAttachments([]);
      if (res.data?.id) setSelectedThreadId(res.data.id);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create discussion thread.');
    }
  };

  return (
    <div className="space-y-5 pb-14">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300 uppercase tracking-wider">
            <span>DISCUSSION & CLARIFICATIONS FACILITY</span>
            <span>·</span>
            <span>IMMUTABLE AUDIT RECORD</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Official Clarification & Discussion Threads
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl">
            Structured communication linked to Problem Statements and Budgetary Offer Requests. Vendor-to-NMDC threads remain strictly confidential to the participating vendor and authorized NMDC personnel; common official clarifications are published to all vendors. Messages are immutable.
          </p>
        </div>

        {(isVendor || isOfficer) && (
          <button
            onClick={() => setNewThreadOpen(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Discussion / Clarification</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[540px]">
        {/* Left: Thread Inbox */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search thread subject, PS/BOR code, vendor..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value as any)}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All Types (PS & BOR)</option>
                <option value="PROBLEM">Problem Statements</option>
                <option value="BUDGETARY_REQUEST">Budgetary Requests</option>
              </select>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All 5 Units</option>
                {organisationalUnits.map((u) => (
                  <option key={u.code} value={u.code}>{u.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {visibleThreads.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No discussion threads available.</p>
                <p>Start a thread linked to a Problem Statement or Budgetary Offer Request.</p>
              </div>
            ) : (
              visibleThreads.map((t) => {
                const isSelected = activeThread?.id === t.id;
                const unreadCount = isVendor ? t.unreadByVendor : t.unreadByOfficer;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectThread(t)}
                    className={`w-full text-left p-3.5 transition-colors space-y-1.5 ${
                      isSelected ? 'bg-blue-50/80 border-l-2 border-blue-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-blue-700">{t.threadCode}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.linkedEntityCode}</span>
                        {t.isDemo && (
                          <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">DEMO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white text-[10px] font-bold">
                            {unreadCount} new
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          t.status === 'Open' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 text-xs line-clamp-1">{t.subject}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">
                        {t.isCommonPublic ? 'Common Official Clarification (All Vendors)' : `Confidential: ${t.vendorName || 'Vendor & NMDC'}`}
                      </span>
                      <span className="font-mono shrink-0">{t.messages.length} msgs</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Conversation Detail */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-slate-700">Select a discussion thread to view messages</p>
              <p>All clarification messages carry sender organisation, role, and official timestamp.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-800">{activeThread.threadCode}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        Ref: {activeThread.linkedEntityCode} ({activeThread.linkedEntityType === 'PROBLEM' ? 'Problem Statement' : 'Budgetary Request'})
                      </span>
                      {activeThread.isCommonPublic ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                          <Globe className="w-3 h-3" />
                          Published Official Clarification
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded">
                          <Lock className="w-3 h-3" />
                          Confidential: {activeThread.vendorName || 'Vendor'} & NMDC Only
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 mt-1">{activeThread.subject}</h2>
                    {activeThread.linkedEntityTitle && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{activeThread.linkedEntityTitle}</p>
                    )}
                  </div>

                  {isOfficer && activeThread.status === 'Open' && (
                    <button
                      onClick={() => handleCloseThread(activeThread.id)}
                      className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      Close Thread
                    </button>
                  )}
                </div>
              </div>

              {/* Immutable Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 max-h-[420px]">
                {activeThread.messages.map((msg) => {
                  const fromVendor = msg.senderRole === 'vendor';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        fromVendor
                          ? 'bg-white border-slate-200 mr-6'
                          : 'bg-blue-50/60 border-blue-200 ml-6'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-slate-900">{msg.senderName}</strong>
                          <span className="text-slate-500">({msg.senderOrganisation})</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                            {msg.senderRole}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 tabular-nums shrink-0">{msg.timestamp}</span>
                      </div>

                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.messageText}</p>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.attachments.map((att, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                              <Paperclip className="w-3 h-3 text-slate-500" />
                              {att.name} ({att.size})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Box or Closed Notice */}
              {activeThread.status === 'Closed' ? (
                <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>
                    This discussion thread was closed on {activeThread.closedAt} by {activeThread.closedBy}. All messages remain permanently preserved for audit.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p-3.5 border-t border-slate-200 bg-white space-y-2.5">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type an official reply or clarification (messages cannot be edited or deleted once posted)..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />

                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {replyAttachments.map((att, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800">
                          {att.name}
                          <button type="button" onClick={() => setReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach PDF / Doc / Image</span>
                      <input type="file" multiple accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg" onChange={(e) => handleFilePick(e, 'reply')} className="hidden" />
                    </label>

                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sending ? 'Sending...' : 'Post Official Message'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* START NEW DISCUSSION MODAL */}
      {newThreadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Start Official Discussion / Clarification</h3>
              <button onClick={() => setNewThreadOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base">✕</button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reference Entity Type</label>
                  <select
                    value={newLinkedType}
                    onChange={(e) => {
                      setNewLinkedType(e.target.value as any);
                      setNewLinkedId('');
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="PROBLEM">Problem Statement</option>
                    <option value="BUDGETARY_REQUEST">Budgetary Offer Request</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Reference <span className="text-rose-600">*</span></label>
                  <select
                    required
                    value={newLinkedId}
                    onChange={(e) => setNewLinkedId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="">-- Select --</option>
                    {newLinkedType === 'PROBLEM'
                      ? problemStatements.map((ps) => (
                          <option key={ps.id} value={ps.id}>{ps.code} – {ps.title.slice(0, 42)}</option>
                        ))
                      : budgetaryRequests.map((b) => (
                          <option key={b.id} value={b.id}>{b.requestCode} – {b.title.slice(0, 42)}</option>
                        ))}
                  </select>
                </div>
              </div>

              {isOfficer && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsCommonPublic}
                      onChange={(e) => setNewIsCommonPublic(e.target.checked)}
                    />
                    <span>Publish as Common Official Clarification (Visible to All Vendors)</span>
                  </label>

                  {!newIsCommonPublic && (
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Confidential Target Vendor</label>
                      <select
                        value={newTargetVendorId}
                        onChange={(e) => setNewTargetVendorId(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      >
                        <option value="">-- Select Vendor --</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Clarification on Conveyor Speed & Power Supply Interface"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message <span className="text-rose-600">*</span></label>
                <textarea
                  rows={3}
                  required
                  value={newFirstMessage}
                  onChange={(e) => setNewFirstMessage(e.target.value)}
                  placeholder="Provide clear technical query or official departmental clarification..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer font-semibold text-slate-700">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach Files ({newAttachments.length})</span>
                  <input type="file" multiple onChange={(e) => handleFilePick(e, 'new')} className="hidden" />
                </label>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewThreadOpen(false)} className="px-3.5 py-1.5 border border-slate-300 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-700 text-white font-bold rounded-lg">Start Discussion</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
