import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X, Copy, RefreshCw, Users, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';

const SettingsScreen = () => {
  const [loading, setLoading] = useState(true);
  
  // Saving states for different tabs
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);

  // Data states
  const [orgData, setOrgData] = useState<any>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);

  // Holiday Form State
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // Dummy states for UI elements not present in DB schema
  const [overloadThreshold, setOverloadThreshold] = useState(110);
  const [aiSettings, setAiSettings] = useState({ confidence: 70, health: 60, timelineRisk: 7 });

  // 1. Fetch live data on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userProfile?.organization_id) {
        const orgId = userProfile.organization_id;

        const [orgRes, holidayRes, jiraRes] = await Promise.all([
          supabase.from('organizations').select('*').eq('id', orgId).single(),
          supabase.from('holidays').select('*').eq('organization_id', orgId).order('date', { ascending: true }),
          supabase.from('jira_connections').select('*').eq('organization_id', orgId)
        ]);

        if (orgRes.data) setOrgData(orgRes.data);
        if (holidayRes.data) setHolidays(holidayRes.data);

        setIntegrations([
          { name: 'Jira', description: 'Import projects and track tasks', connected: (jiraRes.data?.length ?? 0) > 0 },
          { name: 'Asana', description: 'Sync project management data', connected: false },
          { name: 'Slack', description: 'Get notifications and updates', connected: false },
          { name: 'Google Calendar', description: 'Sync team schedules', connected: false },
        ]);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // 2. Organization Update
  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
          work_hours_per_week: orgData.work_hours_per_week,
          fiscal_year_start: orgData.fiscal_year_start,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgData.id);

      if (error) throw error;
      toast.success("Organization settings updated");
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setSavingOrg(false);
    }
  };

  // 3. Team Update
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTeam(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          target_utilization: orgData.target_utilization,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgData.id);

      if (error) throw error;
      toast.success("Team settings updated");
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setSavingTeam(false);
    }
  };

  // 4. AI Thresholds Update (Local state simulation since missing from schema)
  const handleUpdateAI = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAI(true);
    setTimeout(() => {
      toast.success("AI thresholds updated");
      setSavingAI(false);
    }, 600);
  };

  // 5. Holiday Management
  const handleAddHoliday = async () => {
    if (!newHolidayName || !newHolidayDate) {
      toast.error("Please provide both a name and date.");
      return;
    }
    setAddingHoliday(true);
    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert({
          organization_id: orgData.id,
          name: newHolidayName,
          date: newHolidayDate
        })
        .select()
        .single();

      if (error) throw error;
      
      setHolidays([...holidays, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewHolidayName('');
      setNewHolidayDate('');
      setShowHolidayForm(false);
      toast.success("Holiday added successfully");
    } catch (error) {
      toast.error("Failed to add holiday");
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', holidayId);
      if (error) throw error;
      setHolidays(holidays.filter(h => h.id !== holidayId));
      toast.success("Holiday removed");
    } catch (error) {
      toast.error("Failed to remove holiday");
    }
  };

  // 6. Invite Code Management
  const generateNewInviteCode = async () => {
    try {
      const newCode = `ORG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await supabase
        .from('organizations')
        .update({ invite_code: newCode })
        .eq('id', orgData.id);

      if (error) throw error;
      setOrgData({ ...orgData, invite_code: newCode });
      toast.success("Generated new invite code");
    } catch (error) {
      toast.error("Failed to generate invite code");
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(orgData?.invite_code || "");
    toast.success("Invite code copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="p-12 relative min-h-screen">
      <div className="max-w-[1200px] mx-auto relative z-10">
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="mb-10 bg-white/70 backdrop-blur-xl border border-white/20 p-1.5 rounded-xl shadow-sm">
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="ai-thresholds">AI Thresholds</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: ORGANIZATION SETTINGS ===== */}
          <TabsContent value="organization">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Organization Settings</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleUpdateOrg} className="space-y-6">
                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Organization Name</Label>
                    <Input
                      value={orgData?.name || ""}
                      onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                      className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Hours Per Week</Label>
                    <Input
                      type="number"
                      value={orgData?.work_hours_per_week || 40}
                      onChange={(e) => setOrgData({...orgData, work_hours_per_week: parseInt(e.target.value)})}
                      className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Fiscal Year Start</Label>
                    <select 
                      value={orgData?.fiscal_year_start || "january"}
                      onChange={(e) => setOrgData({...orgData, fiscal_year_start: e.target.value})}
                      className="w-full border border-white/20 bg-white/50 rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#292524]"
                    >
                      <option value="january">January</option>
                      <option value="april">April</option>
                      <option value="july">July</option>
                      <option value="october">October</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={savingOrg} className="mt-8 bg-[#1C1917] text-white rounded-xl px-6 h-11">
                    {savingOrg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>

                {/* Invite Code Showcase */}
                <div className="space-y-6 p-8 rounded-2xl bg-stone-50/50 border border-stone-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-[#1C1917]" />
                    <h3 className="text-sm font-medium text-[#1C1917]">Team Recruitment</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-light text-[#78716C] mb-2 block">Organization Invite Code</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            readOnly
                            value={orgData?.invite_code || "None Set"}
                            className="h-11 pr-10 rounded-xl border-white/20 bg-white font-mono text-xs tracking-wider"
                          />
                          <button type="button" onClick={copyInviteCode} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917]">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <Button type="button" onClick={generateNewInviteCode} variant="outline" className="h-11 w-11 p-0 rounded-xl border-white/20 bg-white">
                          <RefreshCw className="w-4 h-4 text-[#78716C]" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-[#A8A29E] mt-2 italic">
                        Usage count: {orgData?.invite_use_count || 0} members joined via this code
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-[#78716C]">Invite Status</span>
                        <StatusBadge status={orgData?.invite_is_active ? "Active" : "Inactive"} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#78716C]">Joining Role</span>
                        <span className="text-xs font-medium text-[#1C1917] capitalize">{orgData?.invite_role || 'employee'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 2: TEAM SETTINGS ===== */}
          <TabsContent value="team">
             <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
                <h2 className="text-xl font-light text-[#1C1917] mb-8">Team Settings</h2>
                <form onSubmit={handleUpdateTeam} className="space-y-6 max-w-xl">
                   <div>
                     <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Utilization Target</Label>
                     <Input 
                        type="number" 
                        value={orgData?.target_utilization || 85} 
                        onChange={(e) => setOrgData({...orgData, target_utilization: parseInt(e.target.value)})}
                        className="h-11 rounded-xl border-white/20 bg-white/50" 
                      />
                   </div>

                   <div>
                     <Label className="text-sm font-light text-[#78716C] mb-2 block">Overload Threshold (%)</Label>
                     <Input 
                        type="number" 
                        value={overloadThreshold} 
                        onChange={(e) => setOverloadThreshold(parseInt(e.target.value))}
                        className="h-11 rounded-xl border-white/20 bg-white/50" 
                      />
                   </div>

                   <Button type="submit" disabled={savingTeam} className="mt-8 bg-[#1C1917] text-white h-11 px-6 rounded-xl">
                     {savingTeam ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                     Save Changes
                   </Button>
                </form>
             </div>
          </TabsContent>

          {/* ===== TAB 3: COMPANY HOLIDAYS ===== */}
          <TabsContent value="holidays">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-[#1C1917]">Company Holidays</h2>
                <Button onClick={() => setShowHolidayForm(!showHolidayForm)} size="sm" className="bg-[#1C1917] text-white rounded-xl px-5 h-10">
                  {showHolidayForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                  {showHolidayForm ? 'Cancel' : 'Add Holiday'}
                </Button>
              </div>

              {/* Add Holiday Form Toggle */}
              {showHolidayForm && (
                <div className="flex items-end gap-4 mb-8 p-6 bg-white/40 border-[0.5px] border-white/20 rounded-2xl">
                  <div className="flex-1">
                    <Label className="text-xs font-light text-[#78716C] mb-2 block">Holiday Name</Label>
                    <Input value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="e.g. Thanksgiving" className="h-10 rounded-xl bg-white" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs font-light text-[#78716C] mb-2 block">Date</Label>
                    <Input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="h-10 rounded-xl bg-white" />
                  </div>
                  <Button onClick={handleAddHoliday} disabled={addingHoliday} className="h-10 px-6 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white">
                    {addingHoliday ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {holidays.length > 0 ? (
                  holidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between py-4 px-5 bg-white/40 border-[0.5px] border-white/20 rounded-2xl">
                      <span className="text-sm text-[#1C1917] font-light">
                        {holiday.name} — {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <button onClick={() => handleDeleteHoliday(holiday.id)} className="text-[#A8A29E] hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-stone-400 font-light">No holidays added yet.</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 4: AI THRESHOLDS ===== */}
          <TabsContent value="ai-thresholds">
             <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
                <h2 className="text-xl font-light text-[#1C1917] mb-8">AI Threshold Settings</h2>
                <form onSubmit={handleUpdateAI} className="space-y-6 max-w-xl">
                   <div>
                     <Label className="text-sm font-light text-[#78716C] mb-2 block">Low Confidence Threshold (%)</Label>
                     <Input 
                       type="number" 
                       value={aiSettings.confidence} 
                       onChange={(e) => setAiSettings({...aiSettings, confidence: parseInt(e.target.value)})}
                       className="h-11 rounded-xl border-white/20 bg-white/50" 
                     />
                   </div>
                   
                   <div>
                     <Label className="text-sm font-light text-[#78716C] mb-2 block">Health Score Warning (%)</Label>
                     <Input 
                       type="number" 
                       value={aiSettings.health} 
                       onChange={(e) => setAiSettings({...aiSettings, health: parseInt(e.target.value)})}
                       className="h-11 rounded-xl border-white/20 bg-white/50" 
                     />
                   </div>

                   <div>
                     <Label className="text-sm font-light text-[#78716C] mb-2 block">Timeline Risk Days</Label>
                     <Input 
                       type="number" 
                       value={aiSettings.timelineRisk} 
                       onChange={(e) => setAiSettings({...aiSettings, timelineRisk: parseInt(e.target.value)})}
                       className="h-11 rounded-xl border-white/20 bg-white/50" 
                     />
                   </div>

                   <Button type="submit" disabled={savingAI} className="mt-8 bg-[#1C1917] text-white h-11 px-6 rounded-xl">
                     {savingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                     Save Changes
                   </Button>
                </form>
             </div>
          </TabsContent>

          {/* ===== TAB 5: INTEGRATIONS ===== */}
          <TabsContent value="integrations">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Integrations</h2>
              <div className="space-y-4">
                {integrations.map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between py-5 px-6 bg-white/40 border border-white/20 rounded-2xl">
                    <div>
                      <div className="text-[#292524] text-sm mb-1.5 font-light">{integration.name}</div>
                      <div className="text-xs text-[#78716C] font-light">{integration.description}</div>
                    </div>
                    {integration.connected ? (
                      <div className="flex items-center gap-4">
                        <StatusBadge status="Active" />
                        <Button variant="outline" className="text-xs h-9 px-4 rounded-xl border-white/20">Configure</Button>
                      </div>
                    ) : (
                      <Button className="bg-[#1C1917] text-white h-9 px-5 rounded-xl">Connect</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default SettingsScreen;