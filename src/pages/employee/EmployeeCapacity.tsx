import { useEffect, useState } from 'react';
import { Loader2, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectCapacity { project_key: string; project_name: string; hours: number; }
interface LeaveRow { id: string; start_date: string; end_date: string; reason: string; status: string; }

export default function EmployeeCapacity() {
  const { user, orgId } = useAuth();
  const [projects, setProjects] = useState<ProjectCapacity[]>([]);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [workHours, setWorkHours] = useState(40);
  const [targetUtil, setTargetUtil] = useState(85);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !orgId) { setLoading(false); return; }
    const email = user.email ?? '';
    Promise.all([
      supabase.from('jira_issues').select('project_key, project_name, time_spent_seconds').eq('org_id', orgId).eq('assignee_email', email),
      supabase.from('leave_requests').select('id, start_date, end_date, reason, status').eq('org_id', orgId).eq('user_id', user.id).order('start_date', { ascending: false }).limit(5),
      supabase.from('organization_settings').select('work_hours_per_week, target_utilization').eq('org_id', orgId).single(),
    ]).then(([issueRes, leaveRes, settingsRes]) => {
      if (!issueRes.error && issueRes.data) {
        const map: Record<string, ProjectCapacity> = {};
        for (const r of issueRes.data as any[]) {
          if (!map[r.project_key]) map[r.project_key] = { project_key: r.project_key, project_name: r.project_name || r.project_key, hours: 0 };
          map[r.project_key].hours += Math.round((r.time_spent_seconds || 0) / 3600);
        }
        setProjects(Object.values(map));
      }
      if (!leaveRes.error && leaveRes.data) setLeaves(leaveRes.data as LeaveRow[]);
      if (!settingsRes.error && settingsRes.data) {
        setWorkHours((settingsRes.data as any).work_hours_per_week || 40);
        setTargetUtil((settingsRes.data as any).target_utilization || 85);
      }
      setLoading(false);
    });
  }, [user, orgId]);

  const totalHours = projects.reduce((s, p) => s + p.hours, 0);
  const utilPct = workHours > 0 ? Math.min(200, Math.round((totalHours / workHours) * 100)) : 0;
  const utilLabel = utilPct >= 100 ? 'Overloaded' : utilPct >= targetUtil ? 'At Capacity' : 'Healthy';
  const utilColor = utilPct >= 100 ? '#BE123C' : utilPct >= targetUtil ? '#D97706' : '#0F766E';
  const strokeCirc = 226;
  const strokeOffset = strokeCirc - (strokeCirc * Math.min(utilPct, 100)) / 100;

  const upcomingLeave = leaves.filter(l => new Date(l.start_date) >= new Date()).slice(0, 3);

  const handleSubmitLeave = async () => {
    if (!user || !orgId || !startDate || !endDate) return;
    setSubmitting(true);
    await supabase.from('leave_requests').insert({
      org_id: orgId,
      user_id: user.id,
      name: user.email?.split('@')[0] ?? 'Employee',
      start_date: startDate,
      end_date: endDate,
      reason: `${leaveType}: ${reason}`.trim(),
      status: 'pending',
    });
    setSubmitting(false);
    setShowModal(false);
    setStartDate(''); setEndDate(''); setReason('');
    // Refresh leaves
    const { data } = await supabase.from('leave_requests').select('id, start_date, end_date, reason, status').eq('org_id', orgId).eq('user_id', user.id).order('start_date', { ascending: false }).limit(5);
    if (data) setLeaves(data as LeaveRow[]);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-teal-400" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto">
      <h1 className="text-4xl font-light text-[#1C1917] mb-10 tracking-tight">My Capacity</h1>

      {/* Overview */}
      <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 mb-12 shadow-sm">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-xs text-[#A8A29E] uppercase mb-4 font-medium tracking-wide">CURRENT UTILIZATION</div>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-5xl font-light" style={{ color: utilColor }}>{utilPct}%</span>
              <span className="text-lg text-[#1C1917] pb-1 font-light">{utilLabel}</span>
            </div>
            <div className="text-sm text-[#78716C] font-light">Target: {targetUtil}% ({workHours}h/wk)</div>
          </div>
          <div className="border-l border-[#F5F5F4] pl-8">
            <div className="text-xs text-[#A8A29E] uppercase mb-4 font-medium tracking-wide">HOURS LOGGED VS CAPACITY</div>
            <div className="flex items-center gap-6">
              <span className="text-3xl font-light text-[#1C1917]">{totalHours}h / {workHours}h</span>
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke="#F5F5F4" strokeWidth="8" />
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke={utilColor} strokeWidth="8" strokeDasharray={String(strokeCirc)} strokeDashoffset={String(strokeOffset)} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[#1C1917]">{utilPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active projects */}
      <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 mb-12 shadow-sm">
        <h2 className="text-xl font-normal text-[#1C1917] mb-6">Projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <div className="text-sm text-[#78716C] font-light py-4">No project data yet.</div>
        ) : (
          <>
            <div className="space-y-4 border-b border-[#F5F5F4] mb-4 pb-4">
              {projects.map(p => (
                <div key={p.project_key} className="flex items-center justify-between py-2">
                  <div className="text-sm font-normal text-[#1C1917] w-1/2">{p.project_name}</div>
                  <div className="text-sm text-[#57534E] font-light">{p.hours}h logged</div>
                </div>
              ))}
            </div>
            <div className="text-sm font-normal text-[#1C1917]">Total Logged: {totalHours}h</div>
          </>
        )}
      </div>

      {/* Time off */}
      <div className="bg-white/70 backdrop-blur-md border border-[#E7E5E4] rounded-xl p-6 mb-12 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-normal text-[#1C1917]">Upcoming Time Off</h2>
          <Button onClick={() => setShowModal(true)} variant="outline" className="text-[#1C1917] border-[#E7E5E4] hover:bg-white hover:border-[#1C1917] h-9 font-light transition-all">
            + Request Leave
          </Button>
        </div>
        {upcomingLeave.length === 0 ? (
          <div className="text-sm text-[#78716C] font-light">No upcoming leave.</div>
        ) : (
          <div className="space-y-3">
            {upcomingLeave.map(l => {
              const statusStyle = l.status === 'approved' || l.status === 'Approved' ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' : l.status === 'pending' || l.status === 'Pending' ? 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]' : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
              return (
                <div key={l.id} className="flex items-center justify-between p-4 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4]">
                  <div className="flex items-center gap-4">
                    <div className="bg-white text-xs px-2 py-1 rounded border border-[#E7E5E4] text-[#57534E]">
                      {new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–{new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div>
                      <div className="text-sm font-normal text-[#1C1917]">{l.reason || 'Leave'}</div>
                    </div>
                  </div>
                  <Badge className={`${statusStyle} font-normal border`}>{l.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave modal */}
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
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Day</SelectItem>
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
              <div className="text-xs text-[#B45309] leading-relaxed font-light">Your request will be sent to your manager for approval.</div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-[#FAFAF9] border-t border-[#F5F5F4] flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowModal(false)} className="h-[44px] px-6 border-[#E7E5E4] text-[#57534E] hover:bg-white font-light">Cancel</Button>
            <Button onClick={handleSubmitLeave} disabled={submitting || !startDate || !endDate} className="bg-[#1C1917] hover:bg-[#292524] h-[44px] px-6 text-white font-light shadow-md">
              {submitting ? 'Submitting…' : 'Submit Request →'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
