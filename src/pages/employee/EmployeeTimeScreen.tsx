/**
 * EmployeeTimeScreen – Tabbed page for Timesheets | Leave | Holidays.
 *
 * - Timesheets tab uses mock data (TimesheetsListScreen).
 * - Leave tab is wired to the backend via useEmployeeTimeData.
 * - Holidays tab is wired to the backend via useEmployeeTimeData.
 * - All icons use Lucide (no MUI).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarCheck,
  Download,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  StickyNote,
  X,
  AlertTriangle,
  Loader2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { useEmployeeTimeData, type LeaveRequest, type LeaveBalance, type LeaveType, type Holiday, type UseEmployeeTimeDataReturn } from '@/hooks/useEmployeeTimeData';
import type { WeekRowData, PastWeekSummary } from '@/types';
import { addDays, format, startOfWeek } from 'date-fns';

// ==================== TYPES ====================

type TimeTab = 'timesheets' | 'leave' | 'holidays';
const VALID_TABS: TimeTab[] = ['timesheets', 'leave', 'holidays'];

// ==================== MAIN COMPONENT ====================

export const EmployeeTimeScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TimeTab | null;
  const initialTab: TimeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'timesheets';

  const [activeTab, setActiveTabState] = useState<TimeTab>(initialTab);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const navigate = useNavigate();

  const timeData = useEmployeeTimeData();

  useEffect(() => {
    const t = searchParams.get('tab') as TimeTab | null;
    if (t && VALID_TABS.includes(t) && t !== activeTab) {
      setActiveTabState(t);
    }
  }, [searchParams]);

  const setActiveTab = useCallback((tab: TimeTab) => {
    setActiveTabState(tab);
    setSearchParams(tab === 'timesheets' ? {} : { tab }, { replace: true });
  }, [setSearchParams]);

  const tabs: { key: TimeTab; label: string }[] = [
    { key: 'timesheets', label: 'Timesheets' },
    { key: 'leave', label: 'Leave Requests' },
    { key: 'holidays', label: 'Holidays' },
  ];

  return (
    <div className="contents">
      {/* Page Header */}
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">Time</h1>
            <p className="text-base text-[#78716C] mt-1 font-light">Manage timesheets, leave requests, and holidays</p>
          </div>
          {activeTab === 'leave' && (
            <Button
              onClick={() => setShowLeaveModal(true)}
              className="bg-[#0F766E] hover:bg-[#0D9488] text-white h-[40px] px-5 font-light shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Request Leave
            </Button>
          )}
        </div>
      </div>

      {timeData.isMockData && (
        <div className="max-w-[1400px] mx-auto bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg px-4 py-2 mb-6 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D97706]" />
            <span className="text-sm text-[#92400E] font-medium tracking-tight">DEMO MODE ACTIVE</span>
            <span className="text-xs text-[#B45309] font-light">&middot; Showing preview data until your organization is fully configured</span>
          </div>
          <button
            onClick={() => navigate('/onboarding/mode')}
            className="text-xs text-[#B45309] hover:underline font-medium"
          >
            Complete setup →
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-[1400px] mx-auto border-b border-[#E7E5E4] mb-8">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-light transition-colors border-b-2 ${activeTab === tab.key
                  ? 'border-[#0F766E] text-[#0F766E]'
                  : 'border-transparent text-[#78716C] hover:text-[#57534E]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'timesheets' && (
        <TimesheetsListScreen
          timeData={timeData}
        />
      )}
      {activeTab === 'leave' && (
        <LeaveTab
          timeData={timeData}
          onRequestLeave={() => setShowLeaveModal(true)}
        />
      )}
      {activeTab === 'holidays' && <HolidaysTab holidays={timeData.holidays} loading={timeData.loading} />}

      {/* Request Leave Modal */}
      <RequestLeaveModal
        open={showLeaveModal}
        onOpenChange={setShowLeaveModal}
        leaveTypes={timeData.leaveTypes}
        onSubmit={async (payload) => {
          const success = await timeData.createLeaveRequest(payload);
          if (success) {
            toast.success('Leave request submitted', {
              description: 'Your manager will review it shortly.',
            });
            setShowLeaveModal(false);
          } else {
            toast.error('Failed to submit leave request');
          }
        }}
      />
    </div>
  );
};

// ==================== LEAVE TAB ====================

const LeaveTab = ({
  timeData,
  onRequestLeave,
}: {
  timeData: ReturnType<typeof useEmployeeTimeData>;
  onRequestLeave: () => void;
}) => {
  const [leaveFilter, setLeaveFilter] = useState<'upcoming' | 'past' | 'pending'>('upcoming');

  const now = new Date();

  const upcoming = timeData.leaveRequests.filter(
    r => r.status === 'approved' && new Date(r.start_date) > now,
  );
  const past = timeData.leaveRequests.filter(
    r => r.status === 'approved' && new Date(r.start_date) <= now,
  );
  const pending = timeData.leaveRequests.filter(r => r.status === 'pending');

  const filteredRequests =
    leaveFilter === 'upcoming' ? upcoming : leaveFilter === 'past' ? past : pending;

  // Calculate remaining days from balances
  const totalRemaining = timeData.leaveBalances.reduce(
    (sum, b) => sum + (b.remaining_days || 0),
    0,
  );

  if (timeData.loading) {
    return (
      <div className="max-w-[1200px] mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F766E] mr-3" />
        <span className="text-[#78716C] font-light">Loading leave data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Leave Balance Summary */}
      <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8">
        <div className="text-[10px] text-[#78716C] uppercase font-semibold tracking-wider mb-4">YOUR LEAVE BALANCE</div>
        <div className="flex items-end gap-8">
          <div>
            <div className="text-[32px] font-light text-[#0F766E]">{totalRemaining}</div>
            <div className="text-sm text-[#57534E] font-light">days remaining</div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-6">
              {timeData.leaveBalances.map(balance => (
                <div key={balance.id}>
                  <div className="text-sm font-light text-[#1C1917] mb-0.5">{balance.leave_type_name || 'Leave'}</div>
                  <div className="text-xs text-[#78716C] font-light">{balance.remaining_days} days</div>
                </div>
              ))}
              {timeData.leaveBalances.length === 0 && (
                <div className="text-xs text-[#78716C] font-light col-span-3">No balances configured yet</div>
              )}
            </div>
            {timeData.leaveBalances.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#CCFBF1]">
                <span className="text-xs text-[#78716C] font-light">
                  Used this year: {timeData.leaveBalances.reduce((s, b) => s + (b.used_days || 0), 0)} days
                  &middot; Total allowance: {timeData.leaveBalances.reduce((s, b) => s + (b.total_days || 0), 0)} days
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Subtabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {([
            { key: 'upcoming' as const, label: 'Upcoming', count: upcoming.length },
            { key: 'past' as const, label: 'Past', count: past.length },
            { key: 'pending' as const, label: 'Pending', count: pending.length },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setLeaveFilter(f.key)}
              className={`px-4 py-2 text-sm font-light rounded-lg transition-all ${leaveFilter === f.key
                  ? 'bg-[#1C1917] text-white shadow-sm'
                  : 'bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#57534E] hover:border-[#A8A29E]'
                }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 text-xs ${leaveFilter === f.key ? 'text-white/70' : 'text-[#A8A29E]'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Calendar className="w-9 h-9 text-[#D6D3D1] mb-4 mx-auto" />
          <h3 className="text-lg font-light text-[#57534E] mb-2">
            {leaveFilter === 'upcoming' ? 'No Upcoming Leave Scheduled' : leaveFilter === 'past' ? 'No Past Leave Records' : 'No Pending Requests'}
          </h3>
          <p className="text-sm text-[#78716C] font-light mb-6">
            {leaveFilter === 'upcoming' ? 'Plan your time off and see the impact on your work' : leaveFilter === 'pending' ? 'All requests have been processed' : ''}
          </p>
          {leaveFilter === 'upcoming' && (
            <Button
              onClick={onRequestLeave}
              className="bg-[#0F766E] hover:bg-[#0D9488] text-white font-light shadow-md transition-all"
            >
              Request Leave
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              onWithdraw={async () => {
                const ok = await timeData.withdrawLeaveRequest(request.id);
                if (ok) toast.success('Leave request withdrawn');
                else toast.error('Failed to withdraw request');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== LEAVE REQUEST CARD ====================

const LeaveRequestCard = ({
  request,
  onWithdraw,
}: {
  request: LeaveRequest;
  onWithdraw: () => void;
}) => {
  const statusConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; cardBg: string; cardBorder: string }> = {
    approved: { label: 'Approved', icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]', border: 'border-[#CCFBF1]', cardBg: 'bg-white', cardBorder: 'border-[#E7E5E4]' },
    pending: { label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#FDE68A]', cardBg: 'bg-[#FFFBEB]', cardBorder: 'border-[#D6D3D1]' },
    rejected: { label: 'Denied', icon: null, bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', border: 'border-[#FECACA]', cardBg: 'bg-white', cardBorder: 'border-[#E7E5E4]' },
    withdrawn: { label: 'Withdrawn', icon: null, bg: 'bg-[#F5F5F4]', text: 'text-[#78716C]', border: 'border-[#E7E5E4]', cardBg: 'bg-white', cardBorder: 'border-[#E7E5E4]' },
  };
  const config = statusConfig[request.status] || statusConfig.pending;

  const startDate = new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endDate = new Date(request.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Calculate duration in business days
  const start = new Date(request.start_date);
  const end = new Date(request.end_date);
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) days++;
    current.setDate(current.getDate() + 1);
  }

  return (
    <div className={`${config.cardBg} border ${config.cardBorder} rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium text-[#1C1917]">{request.leave_type_name || 'Leave'}</div>
        <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text} border ${config.border}`}>
          {config.icon}
          {config.label}
        </span>
      </div>
      <div className="space-y-1.5 mb-3">
        <p className="text-sm text-[#57534E] font-light">
          {startDate}{startDate !== endDate ? ` – ${endDate}` : ''} &middot; {days} day{days !== 1 ? 's' : ''}
        </p>
        {request.reason && <p className="text-xs text-[#78716C] font-light">Reason: {request.reason}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        {request.status === 'pending' && (
          <button
            onClick={onWithdraw}
            className="text-xs text-[#78716C] hover:text-[#1C1917] font-light transition-colors rounded px-1"
          >
            Withdraw
          </button>
        )}
        {request.status === 'approved' && (
          <button
            onClick={() => toast.info('Details view coming soon')}
            className="text-xs text-[#0F766E] hover:text-[#0D9488] font-medium transition-colors rounded px-1"
          >
            View Full Details
          </button>
        )}
      </div>
    </div>
  );
};

// ==================== HOLIDAYS TAB ====================

const HolidaysTab = ({ holidays, loading }: { holidays: Holiday[]; loading: boolean }) => {
  console.log('[HolidaysTab] Rendering with holidays count:', holidays?.length || 0);
  const today = new Date();

  const holidaysWithMeta = holidays.map(h => {
    const date = new Date(h.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const diffMs = date.getTime() - today.getTime();
    const daysAway = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isPast = daysAway < 0;
    return { ...h, dayOfWeek, dateLabel, daysAway, isPast };
  });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F766E] mr-3" />
        <span className="text-[#78716C] font-light">Loading holidays...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex gap-6">
        {/* Left Column: Holiday List */}
        <div className="w-[55%]">
          <h2 className="text-xl font-light text-[#1C1917] mb-6">Company Holidays {today.getFullYear()}</h2>

          {holidaysWithMeta.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
              <CalendarCheck className="w-8 h-8 text-[#D6D3D1] mx-auto mb-3" />
              <p className="text-[#78716C] font-light">No holidays configured for your organization yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {holidaysWithMeta.map(holiday => (
                <div
                  key={holiday.id}
                  className={`bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-300 ${holiday.isPast ? 'opacity-60' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${holiday.isPast ? 'bg-[#F5F5F4]' : 'bg-[#F0FDFA]'
                      }`}>
                      {holiday.isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-[#A8A29E]" />
                      ) : (
                        <CalendarCheck className="w-4 h-4 text-[#0F766E]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${holiday.isPast ? 'text-[#A8A29E]' : 'text-[#1C1917]'}`}>
                        {holiday.name}
                      </div>
                      <div className="text-xs text-[#78716C] font-light mt-0.5">
                        {holiday.dateLabel} &middot; {holiday.dayOfWeek}
                      </div>
                    </div>
                    <span className={`text-[11px] font-light flex-shrink-0 ${holiday.isPast ? 'text-[#A8A29E]' : 'text-[#78716C]'}`}>
                      {holiday.isPast ? `${Math.abs(holiday.daysAway)} days ago` : `${holiday.daysAway} days away`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <span className="text-xs text-[#78716C] font-light">
              Total: {holidays.length} company holidays this year
            </span>
            <button
              onClick={() => toast.success('Calendar download started')}
              className="flex items-center gap-1.5 text-xs text-[#0F766E] hover:text-[#0D9488] font-medium transition-colors rounded px-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download Calendar (.ics)
            </button>
          </div>
        </div>

        {/* Right Column: Planning */}
        <div className="w-[45%]">
          <h2 className="text-xl font-light text-[#1C1917] mb-6">Plan Around Holidays</h2>

          <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-6">
            <div className="text-[10px] text-[#0F766E] uppercase font-semibold tracking-wider mb-4 flex items-center gap-1.5">
              <span>💡</span> SMART HOLIDAY PLANNING
            </div>
            <p className="text-xs text-[#57534E] font-light mb-4">
              Maximize your time off by combining leave with holidays.
            </p>
            <div className="space-y-4">
              {holidaysWithMeta.filter(h => !h.isPast && h.daysAway < 120).slice(0, 3).map(h => (
                <div key={h.id}>
                  <div className="text-sm font-medium text-[#1C1917] mb-1">{h.name}</div>
                  <p className="text-xs text-[#78716C] font-light">{h.dateLabel} ({h.dayOfWeek})</p>
                  <p className="text-xs text-[#0F766E] font-light mt-0.5">
                    {h.daysAway} days away — plan a long weekend!
                  </p>
                </div>
              ))}
              {holidaysWithMeta.filter(h => !h.isPast && h.daysAway < 120).length === 0 && (
                <p className="text-xs text-[#78716C] font-light">No upcoming holidays in the next 4 months.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== REQUEST LEAVE MODAL ====================

const RequestLeaveModal = ({
  open,
  onOpenChange,
  leaveTypes,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leaveTypes: LeaveType[];
  onSubmit: (payload: { leave_type_id: string; start_date: string; end_date: string; reason?: string }) => void;
}) => {
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setLeaveTypeId(leaveTypes[0]?.id || '');
      setStartDate('');
      setEndDate('');
      setReason('');
    }
  }, [open, leaveTypes]);

  const handleSubmit = async () => {
    if (!leaveTypeId || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    await onSubmit({ leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason });
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-[#E7E5E4] rounded-2xl shadow-2xl max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-[#1C1917]">Request Leave</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <Label className="text-sm text-[#57534E] font-light mb-2 block">Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger className="border-[#E7E5E4] h-[40px] font-light focus:ring-[#2DD4BF]/50">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E7E5E4]">
                {leaveTypes.map(lt => (
                  <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                ))}
                {leaveTypes.length === 0 && (
                  <SelectItem value="_none" disabled>No leave types configured</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-[#57534E] font-light mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="border-[#E7E5E4] focus-visible:ring-[#2DD4BF]/50 h-[40px] font-light"
              />
            </div>
            <div>
              <Label className="text-sm text-[#57534E] font-light mb-2 block">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="border-[#E7E5E4] focus-visible:ring-[#2DD4BF]/50 h-[40px] font-light"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm text-[#57534E] font-light mb-2 block">Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Add any additional details..."
              className="border-[#E7E5E4] focus-visible:ring-[#2DD4BF]/50 font-light min-h-[80px] resize-none"
            />
          </div>

          {/* Impact Preview */}
          <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-3">
            <div className="text-[10px] text-[#92400E] uppercase font-semibold tracking-wider mb-2">IMPACT PREVIEW</div>
            <p className="text-xs text-[#78716C] font-light">
              Select dates to see how this leave will affect your projects and team capacity.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-white font-light transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !leaveTypeId || !startDate || !endDate}
            className="bg-[#0F766E] hover:bg-[#0D9488] text-white font-light shadow-md transition-all disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== TIMESHEETS LIST (MOCK DATA) ====================

const getWeekDates = (weekOffset: number) => {
  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });

  const dates: { day: string; label: string; full: Date }[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    dates.push({
      day: dayNames[i],
      label: format(d, 'MMM d'),
      full: d,
    });
  }

  const sunday = dates[6].full;
  const rangeLabel = `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d, yyyy')}`;

  return { dates, rangeLabel, monday, sunday };
};

const TimesheetNotePopover = ({ note, onSave, cellKey }: { note: string; onSave: (key: string, val: string) => void; cellKey: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(note);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-4 h-4 flex items-center justify-center rounded transition-colors ${note ? 'text-[#0F766E]' : 'text-[#D6D3D1] hover:text-[#A8A29E]'
          }`}
      >
        <StickyNote className="w-3 h-3" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-48 bg-white border border-[#E7E5E4] rounded-lg shadow-xl p-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Add note..."
              className="w-full h-16 text-xs font-light bg-[#FAFAF9] border border-[#E7E5E4] rounded p-2 resize-none outline-none focus:border-[#2DD4BF]"
            />
            <div className="flex justify-end gap-1 mt-2">
              <button onClick={() => setIsOpen(false)} className="text-[10px] text-[#78716C] px-2 py-0.5 hover:text-[#1C1917]">Cancel</button>
              <button onClick={() => { onSave(cellKey, value); setIsOpen(false); }} className="text-[10px] text-white bg-[#1C1917] px-2 py-0.5 rounded">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TimesheetsListScreen = ({
  timeData
}: {
  timeData: UseEmployeeTimeDataReturn
}) => {
  const navigate = useNavigate();
  const [showPastWeeks, setShowPastWeeks] = useState(false);

  const { dates: weekDates, rangeLabel, monday } = useMemo(() => getWeekDates(timeData.currentWeekOffset), [timeData.currentWeekOffset]);
  const dayNames = weekDates.map(d => d.day);
  const dateLabels = weekDates.map(d => d.label);

  const weekMeta = timeData.timesheetWeeks[timeData.currentWeekOffset];
  const rows = weekMeta?.rows ?? [];
  const weekStatus = weekMeta?.status ?? 'No Data';

  const [notesByWeek, setNotesByWeek] = useState<Record<number, Record<string, string>>>({});

  const notes = notesByWeek[timeData.currentWeekOffset] ?? {};
  const isEditable = weekStatus === 'Draft' || weekStatus === 'No Data';

  const [localRows, setLocalRows] = useState<WeekRowData[]>([]);

  // Update local rows when DB rows change
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const handleHourChange = useCallback(async (rowId: string, dayIdx: number, value: string) => {
    if (!isEditable) return;
    const num = parseFloat(value) || 0;
    
    // Update local state immediately for snappy UI
    setLocalRows(prev => prev.map(r => 
      r.id === rowId ? { ...r, hours: r.hours.map((h, i) => i === dayIdx ? num : h) } : r
    ));

    const row = localRows.find(r => r.id === rowId);
    if (!row) return;

    const workDate = format(addDays(monday, dayIdx), 'yyyy-MM-dd');
    
    await timeData.saveTimesheetEntry({
      project_id: row.type === 'project' ? row.id : null,
      task_name: row.type === 'project' ? row.task : row.project,
      work_date: workDate,
      hours_logged: num,
      description: notes[`${rowId}-${dayIdx}`] || ''
    });
  }, [timeData.currentWeekOffset, isEditable, localRows, monday, notes, timeData.saveTimesheetEntry]);

  const handleNoteSave = useCallback((key: string, value: string) => {
    setNotesByWeek(prev => ({
      ...prev,
      [timeData.currentWeekOffset]: { ...(prev[timeData.currentWeekOffset] ?? {}), [key]: value },
    }));
  }, [timeData.currentWeekOffset]);

  const addActivity = useCallback(() => {
    if (!isEditable) return;
    const newId = `adhoc-${Date.now()}`;
    setLocalRows(prev => [...prev, {
      id: newId,
      type: 'adhoc' as const,
      project: '',
      task: '',
      suggested: [0, 0, 0, 0, 0, 0, 0],
      hours: [0, 0, 0, 0, 0, 0, 0],
    }]);
  }, [isEditable]);

  const removeRow = useCallback((rowId: string) => {
    setLocalRows(prev => prev.filter(r => r.id !== rowId));
  }, []);

  const updateRowField = useCallback((rowId: string, field: 'project' | 'task', value: string) => {
    setLocalRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  }, []);

  const dayTotals = dayNames.map((_, dIdx) => localRows.reduce((sum, r) => sum + r.hours[dIdx], 0));
  const rowTotals = localRows.map(r => r.hours.reduce((a, b) => a + b, 0));
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);
  const suggestedTotal = localRows.reduce((sum, r) => sum + r.suggested.reduce((a, b) => a + b, 0), 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-[#FAFAF9] text-[#78716C] border-[#E7E5E4]';
      case 'Approved': return 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]';
      case 'Pending Review': return 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]';
      case 'Submitted': return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]';
      default: return 'bg-[#F5F5F4] text-[#A8A29E] border-[#E7E5E4]';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {isEditable && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => navigate('/app/employee/time/timesheets/current')}
            className="bg-[#1C1917] hover:bg-[#292524] text-white px-6 h-[40px] font-light shadow-md transition-all duration-300"
          >
            Edit in Full View →
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-light text-[#1C1917] tracking-tight">Week of {rangeLabel}</h2>
            <Badge className={`${statusBadge(weekStatus)} hover:bg-opacity-80 font-normal border text-xs py-0.5 px-2.5`}>
              {weekStatus === 'Approved' ? '✓ ' : weekStatus === 'Pending Review' ? '⏳ ' : weekStatus === 'Draft' ? '✎ ' : ''}{weekStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timeData.currentWeekOffset !== 0 && (
            <Button
              variant="outline"
              onClick={() => timeData.setWeekOffset(0)}
              className="h-9 px-4 border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-white font-light transition-all text-xs"
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Today
            </Button>
          )}

          <div className="flex items-center border border-[#E7E5E4] rounded-lg overflow-hidden">
            <button
              onClick={() => timeData.setWeekOffset(timeData.currentWeekOffset - 1)}
              className="h-9 w-9 flex items-center justify-center text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4] transition-colors border-r border-[#E7E5E4]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => timeData.setWeekOffset(timeData.currentWeekOffset + 1)}
              className="h-9 w-9 flex items-center justify-center text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowPastWeeks(prev => !prev)}
            className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all ${showPastWeeks
                ? 'bg-[#1C1917] text-white border-[#1C1917]'
                : 'border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4]'
              }`}
            title="Past weeks"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Past weeks selector */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: showPastWeeks ? '200px' : '0px', opacity: showPastWeeks ? 1 : 0, marginBottom: showPastWeeks ? '16px' : '0px' }}
      >
        <div className="grid grid-cols-4 gap-3">
          {timeData.pastWeeksSummary.map((pw) => (
            <button
              key={pw.offset}
              onClick={() => { timeData.setWeekOffset(pw.offset); setShowPastWeeks(false); }}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 group ${timeData.currentWeekOffset === pw.offset
                  ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-md'
                  : 'bg-white/70 backdrop-blur-md border-[#E7E5E4] hover:border-[#A8A29E] hover:shadow-sm'
                }`}
            >
              <div className={`text-xs font-light mb-1 ${timeData.currentWeekOffset === pw.offset ? 'text-white/70' : 'text-[#78716C]'}`}>
                {pw.label}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-light ${timeData.currentWeekOffset === pw.offset ? 'text-white' : 'text-[#1C1917]'}`}>
                  {pw.hours}h
                </span>
                <span className={`text-[10px] font-light px-1.5 py-0.5 rounded-full border ${timeData.currentWeekOffset === pw.offset
                    ? 'border-white/30 text-white/80'
                    : pw.status === 'Approved'
                      ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]'
                      : 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]'
                  }`}>
                  {pw.status === 'Approved' ? '✓' : '⏳'} {pw.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {localRows.length > 0 ? (
        <>
          <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm mb-4">
            {/* Header */}
            <div className="grid grid-cols-[260px_repeat(7,1fr)_72px] bg-[#FAFAF9] border-b border-[#E7E5E4]">
              <div className="p-4 text-xs font-medium text-[#78716C] uppercase tracking-wider border-r border-[#E7E5E4]">
                Project / Activity
              </div>
              {dayNames.map((day, i) => (
                <div key={i} className={`p-3 text-center border-r border-[#E7E5E4] last:border-r-0 ${i >= 5 ? 'bg-[#F5F5F4]/50' : ''}`}>
                  <div className="text-xs font-medium text-[#78716C] uppercase tracking-wider">{day}</div>
                  <div className="text-[10px] text-[#78716C] font-light mt-0.5">{dateLabels[i]}</div>
                </div>
              ))}
              <div className="p-3 text-center bg-[#FAFAF9]">
                <div className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Total</div>
              </div>
            </div>

            {/* Rows */}
            {localRows.map((row, rIdx) => (
              <div key={row.id} className="grid grid-cols-[260px_repeat(7,1fr)_72px] border-b border-[#E7E5E4]/60 hover:bg-[#FAFAF9]/30 transition-colors group">
                <div className="p-4 border-r border-[#E7E5E4] flex items-start gap-3">
                  {row.type === 'adhoc' && isEditable ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Activity name..."
                        value={row.project}
                        onChange={(e) => updateRowField(row.id, 'project', e.target.value)}
                        className="h-7 text-xs bg-white border-[#E7E5E4] font-light px-2"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={row.task}
                        onChange={(e) => updateRowField(row.id, 'task', e.target.value)}
                        className="h-7 text-xs bg-white border-[#E7E5E4] font-light px-2 text-[#78716C]"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1C1917] font-light truncate">{row.project}</div>
                      <div className="text-[11px] text-[#78716C] font-light truncate mt-0.5">{row.task}</div>
                      <div className="text-[10px] text-[#D6D3D1] font-light mt-1">
                        Suggested: {row.suggested.reduce((a, b) => a + b, 0)}h/wk
                      </div>
                    </div>
                  )}
                  {row.type === 'adhoc' && isEditable && (
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-[#D6D3D1] hover:text-rose-500 transition-colors mt-1 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {dayNames.map((_, dIdx) => {
                  const cellKey = `${row.id}-${dIdx}`;
                  const suggestedVal = row.suggested[dIdx];
                  const actualVal = row.hours[dIdx];
                  const isDifferent = actualVal !== suggestedVal && suggestedVal > 0;

                  return (
                    <div key={dIdx} className={`p-2 border-r border-[#E7E5E4]/40 flex flex-col items-center justify-center gap-1 ${dIdx >= 5 ? 'bg-[#F5F5F4]/30' : ''}`}>
                      <div className="relative w-full">
                        {isEditable ? (
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={actualVal || ''}
                            onChange={(e) => handleHourChange(row.id, dIdx, e.target.value)}
                            className={`w-full h-9 text-center text-sm font-light bg-transparent border border-transparent rounded-lg focus:border-[#2DD4BF] focus:bg-white focus:ring-1 focus:ring-[#2DD4BF]/20 outline-none transition-all hover:bg-white/80 hover:border-[#E7E5E4] ${isDifferent ? 'text-[#0F766E]' : 'text-[#1C1917]'
                              } ${actualVal === 0 && dIdx < 5 ? 'text-[#D6D3D1]' : ''}`}
                            placeholder="–"
                          />
                        ) : (
                          <div className={`w-full h-9 flex items-center justify-center text-sm font-light rounded-lg ${isDifferent ? 'text-[#0F766E]' : 'text-[#1C1917]'
                            } ${actualVal === 0 ? 'text-[#D6D3D1]' : ''}`}>
                            {actualVal > 0 ? actualVal : '–'}
                          </div>
                        )}
                      </div>
                      <TimesheetNotePopover
                        note={notes[cellKey] || ''}
                        onSave={handleNoteSave}
                        cellKey={cellKey}
                      />
                    </div>
                  );
                })}

                <div className="p-3 flex items-center justify-center">
                  <span className={`text-sm font-medium ${rowTotals[rIdx] > 40 ? 'text-rose-600' : 'text-[#1C1917]'}`}>
                    {rowTotals[rIdx]}h
                  </span>
                </div>
              </div>
            ))}

            {/* Add Activity Row */}
            {isEditable && (
              <div className="grid grid-cols-[260px_repeat(7,1fr)_72px] border-b border-[#E7E5E4]/60">
                <div className="p-4 border-r border-[#E7E5E4]">
                  <button
                    onClick={addActivity}
                    className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] font-light transition-colors group"
                  >
                    <Plus className="w-4 h-4 text-[#A8A29E] group-hover:text-[#1C1917]" />
                    Add Activity
                  </button>
                </div>
                {dayNames.map((_, i) => (
                  <div key={i} className={`border-r border-[#E7E5E4]/40 ${i >= 5 ? 'bg-[#F5F5F4]/30' : ''}`} />
                ))}
                <div />
              </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-[260px_repeat(7,1fr)_72px] bg-[#FAFAF9] border-t border-[#E7E5E4]">
              <div className="p-4 border-r border-[#E7E5E4] text-xs font-medium text-[#78716C] uppercase tracking-wider flex items-center">
                Daily Totals
              </div>
              {dayTotals.map((total, i) => (
                <div key={i} className={`p-3 text-center border-r border-[#E7E5E4]/40 ${i >= 5 ? 'bg-[#F5F5F4]/50' : ''}`}>
                  <span className={`text-sm font-medium ${total > 10 ? 'text-amber-600' : total > 0 ? 'text-[#1C1917]' : 'text-[#D6D3D1]'}`}>
                    {total > 0 ? `${total}h` : '–'}
                  </span>
                </div>
              ))}
              <div className="p-3 text-center">
                <span className={`text-sm font-medium ${grandTotal > 40 ? 'text-rose-600' : 'text-[#1C1917]'}`}>
                  {grandTotal}h
                </span>
              </div>
            </div>

            {/* Suggested */}
            <div className="grid grid-cols-[260px_repeat(7,1fr)_72px] bg-[#F5F5F4]/50">
              <div className="p-3 border-r border-[#E7E5E4] text-[10px] text-[#78716C] font-light uppercase tracking-wider flex items-center pl-4">
                Suggested
              </div>
              {dayNames.map((_, i) => {
                const sugTotal = rows.reduce((sum, r) => sum + r.suggested[i], 0);
                return (
                  <div key={i} className="p-2 text-center border-r border-[#E7E5E4]/40">
                    <span className="text-[11px] text-[#78716C] font-light">{sugTotal > 0 ? `${sugTotal}h` : '–'}</span>
                  </div>
                );
              })}
              <div className="p-2 text-center">
                <span className="text-[11px] text-[#78716C] font-light">{suggestedTotal}h</span>
              </div>
            </div>
          </div>

          {grandTotal > 40 && (
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-4 flex items-center gap-3 mb-4 animate-in fade-in duration-300">
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
              <span className="text-sm text-[#92400E] font-light">
                {grandTotal}h logged this week ({grandTotal - 40}h over standard 40h/week).
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 pb-6">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-[#78716C] uppercase font-medium tracking-wide mb-1">Total Hours</div>
                <div className="text-3xl font-light text-[#1C1917]">{grandTotal}h</div>
              </div>
              <div className="h-10 w-px bg-[#E7E5E4]" />
              <div>
                <div className="text-xs text-[#78716C] uppercase font-medium tracking-wide mb-1">vs. Suggested</div>
                <div className={`text-3xl font-light ${grandTotal > suggestedTotal ? 'text-amber-600' : grandTotal < suggestedTotal ? 'text-[#0F766E]' : 'text-[#1C1917]'}`}>
                  {grandTotal >= suggestedTotal ? '+' : ''}{grandTotal - suggestedTotal}h
                </div>
              </div>
            </div>
            {isEditable && (
              <div className="flex gap-3">
                <LoadingButton variant="outline" onClick={async () => {
                  toast.success('All changes saved to database');
                }} className="h-11 px-8 border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-white font-light transition-all">
                  Save Draft
                </LoadingButton>
                <LoadingButton onClick={() => timeData.submitTimesheet(timeData.currentWeekOffset)} className="h-11 px-8 bg-[#1C1917] hover:bg-[#292524] text-white font-light shadow-md transition-all">
                  Submit Timesheet
                  <ArrowRight className="w-4 h-4 ml-2" />
                </LoadingButton>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-16 text-center shadow-sm mb-6">
          <Calendar className="w-10 h-10 text-[#D6D3D1] mx-auto mb-4" />
          <h3 className="text-lg font-light text-[#57534E] mb-2">No timesheet data for this week</h3>
          <p className="text-sm text-[#78716C] font-light mb-6">Navigate to a different week or start logging time for this period.</p>
        </div>
      )}
    </div>
  );
};


