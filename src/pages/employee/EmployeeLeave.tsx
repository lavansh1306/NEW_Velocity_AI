import { useEffect, useState } from 'react';
import { Plus, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveRow {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

const diffDays = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
};

const statusStyle = (s: string) => {
  const norm = s?.toLowerCase();
  if (norm === 'approved') return 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]';
  if (norm === 'pending') return 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]';
  return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
};

export default function EmployeeLeave() {
  const { user, orgId } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    if (!user || !orgId) return;
    const { data } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, reason, status, created_at')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLeaves((data as LeaveRow[]) || []);
  };

  useEffect(() => {
    if (!user || !orgId) { setLoading(false); return; }
    fetchLeaves().finally(() => setLoading(false));
  }, [user, orgId]);

  const approved = leaves.filter(l => l.status?.toLowerCase() === 'approved');
  const pending = leaves.filter(l => l.status?.toLowerCase() === 'pending');
  const approvedDays = approved.reduce((s, l) => s + diffDays(l.start_date, l.end_date), 0);
  const pendingDays = pending.reduce((s, l) => s + diffDays(l.start_date, l.end_date), 0);

  const handleSubmit = async () => {
    if (!user || !orgId || !startDate || !endDate) return;
    setSubmitting(true);
    await supabase.from('leave_requests').insert({
      org_id: orgId,
      user_id: user.id,
      name: user.email?.split('@')[0] ?? 'Employee',
      start_date: startDate,
      end_date: endDate,
      reason: `${leaveType}${reason ? ': ' + reason : ''}`,
      status: 'pending',
    });
    setSubmitting(false);
    setShowModal(false);
    setStartDate(''); setEndDate(''); setReason('');
    await fetchLeaves();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal-400" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-light text-[#1C1917] tracking-tight">Leave Requests</h1>
        <Button onClick={() => setShowModal(true)} className="bg-[#1C1917] hover:bg-[#292524] text-white h-[40px] px-6 font-medium shadow-md flex items-center gap-2">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New Request
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {[
          { label: 'Total Requests', value: String(leaves.length), sub: 'all time' },
          { label: 'Days Used', value: String(approvedDays), sub: 'approved' },
          { label: 'Pending', value: String(pendingDays), sub: 'awaiting approval' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-5 shadow-sm">
            <div className="text-xs text-[#A8A29E] uppercase tracking-wide mb-2">{label}</div>
            <div className="text-3xl font-light text-[#1C1917]">{value}</div>
            <div className="text-xs text-[#78716C] mt-1 font-light">{sub}</div>
          </div>
        ))}
      </div>

      {/* Leave history */}
      <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-[#FAFAF9] px-6 py-3 text-xs font-medium text-[#A8A29E] uppercase border-b border-[#E7E5E4] tracking-wider">
          <div className="col-span-3">Reason</div>
          <div className="col-span-2">Start</div>
          <div className="col-span-2">End</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-3 text-right">Status</div>
        </div>
        {leaves.length === 0 ? (
          <div className="py-16 text-center text-[#78716C] font-light">No leave requests yet.</div>
        ) : (
          leaves.map((l) => {
            const days = diffDays(l.start_date, l.end_date);
            return (
              <div key={l.id} className="grid grid-cols-12 px-6 py-4 items-center border-b border-[#F5F5F4] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                <div className="col-span-3 text-sm text-[#1C1917] font-light truncate">{l.reason || '—'}</div>
                <div className="col-span-2 text-sm text-[#57534E] font-light">{new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="col-span-2 text-sm text-[#57534E] font-light">{new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="col-span-2 text-sm text-[#57534E] font-light">{days} {days === 1 ? 'day' : 'days'}</div>
                <div className="col-span-3 flex justify-end">
                  <Badge className={`${statusStyle(l.status)} font-normal border text-xs`}>{l.status}</Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-white border border-[#E7E5E4] shadow-2xl">
          <DialogHeader className="p-6 border-b border-[#F5F5F4]">
            <DialogTitle className="text-2xl font-light text-[#1C1917]">Request Time Off</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div>
              <Label className="text-sm font-medium text-[#57534E] mb-2 block">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-[44px] bg-white border-[#E7E5E4] font-light"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal">Personal Day</SelectItem>
                  <SelectItem value="Parental Leave">Parental Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm font-medium text-[#57534E] mb-2 block">Start Date</Label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-[44px] border border-[#E7E5E4] rounded-md px-3 font-light text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-1 focus:ring-[#0F766E]" />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium text-[#57534E] mb-2 block">End Date</Label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-[44px] border border-[#E7E5E4] rounded-md px-3 font-light text-sm text-[#1C1917] bg-white focus:outline-none focus:ring-1 focus:ring-[#0F766E]" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-[#57534E] mb-2 block">Reason (Optional)</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Add a note for your manager..." className="h-[100px] bg-white border-[#E7E5E4] font-light placeholder:text-[#D6D3D1]" />
            </div>
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-4 flex gap-3">
              <Zap className="h-5 w-5 text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="text-xs text-[#B45309] leading-relaxed font-light">Your request will be submitted for manager approval.</div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-[#FAFAF9] border-t border-[#F5F5F4] flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowModal(false)} className="h-[44px] px-6 border-[#E7E5E4] text-[#57534E] hover:bg-white font-light">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !startDate || !endDate} className="bg-[#1C1917] hover:bg-[#292524] h-[44px] px-6 text-white font-light shadow-md">
              {submitting ? 'Submitting…' : 'Submit Request →'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
