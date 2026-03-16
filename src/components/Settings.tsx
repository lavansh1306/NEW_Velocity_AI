import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { organizationApi } from '@/services/organizationApi';
import { Organization } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SettingsScreen = () => {
  const [settings, setSettings] = useState<Partial<Organization>>({});
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for new holiday modal
  const [newHoliday, setNewHoliday] = useState({ name: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [showAddHoliday, setShowAddHoliday] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, holidaysData] = await Promise.all([
        organizationApi.getSettings(),
        organizationApi.getHolidays()
      ]);
      setSettings(settingsData);
      setHolidays(holidaysData);
    } catch (error: any) {
      toast.error('Failed to load settings', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = (field: keyof Organization, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      await organizationApi.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error('Failed to save settings', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error('Please provide both name and date');
      return;
    }
    try {
      setIsSaving(true);
      const added = await organizationApi.addHoliday(newHoliday);
      setHolidays(prev => [...prev, added].sort((a, b) => a.date.localeCompare(b.date)));
      setNewHoliday({ name: '', date: format(new Date(), 'yyyy-MM-dd') });
      setShowAddHoliday(false);
      toast.success('Holiday added successfully');
    } catch (error: any) {
      toast.error('Failed to add holiday', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await organizationApi.deleteHoliday(id);
      setHolidays(prev => prev.filter(h => h.id !== id));
      toast.success('Holiday removed');
    } catch (error: any) {
      toast.error('Failed to remove holiday', { description: error.message });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#2DD4BF] animate-spin mb-4" />
        <p className="text-[#78716C] font-light">Loading settings...</p>
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
              <div className="space-y-6 max-w-xl">
                {/* Organization Name */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Organization Name</Label>
                  <Input
                    value={settings.name || ''}
                    onChange={e => handleUpdateSetting('name', e.target.value)}
                    placeholder="Acme Inc."
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                </div>

                {/* Default Work Hours Per Week */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Hours Per Week</Label>
                  <Input
                    type="number"
                    value={settings.work_hours_per_week || 40}
                    onChange={e => handleUpdateSetting('work_hours_per_week', parseInt(e.target.value))}
                    placeholder="40"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                </div>

                {/* Default Work Days Per Week */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Days Per Week</Label>
                  <Input
                    type="number"
                    value={settings.work_days_per_week || 5}
                    onChange={e => handleUpdateSetting('work_days_per_week', parseInt(e.target.value))}
                    placeholder="5"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                </div>

                {/* Fiscal Year Start */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Fiscal Year Start</Label>
                  <select 
                    value={settings.fiscal_year_start || 'january'}
                    onChange={e => handleUpdateSetting('fiscal_year_start', e.target.value)}
                    className="w-full border border-white/20 bg-white/50 rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#292524]"
                  >
                    <option value="january">January</option>
                    <option value="april">April</option>
                    <option value="july">July</option>
                    <option value="october">October</option>
                  </select>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 2: TEAM SETTINGS ===== */}
          <TabsContent value="team">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Team Settings</h2>
              <div className="space-y-6 max-w-xl">
                {/* Default Utilization Target */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Utilization Target (%)</Label>
                  <Input
                    type="number"
                    value={settings.target_utilization || 85}
                    onChange={e => handleUpdateSetting('target_utilization', parseInt(e.target.value))}
                    placeholder="85"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Target utilization percentage for team members
                  </div>

                {/* Overload Threshold */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Overload Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.overload_threshold || 110}
                    onChange={e => handleUpdateSetting('overload_threshold', parseInt(e.target.value))}
                    placeholder="110"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Alert when utilization exceeds this percentage
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 3: COMPANY HOLIDAYS (LIVE) ===== */}
          <TabsContent value="holidays">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-[#1C1917]">Company Holidays</h2>
                <Button
                  size="sm"
                  onClick={() => setShowAddHoliday(!showAddHoliday)}
                  className="bg-[#1C1917] hover:bg-[#292524] h-10 px-5 rounded-xl font-light transition-all duration-300 text-white shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showAddHoliday ? 'Cancel' : 'Add Holiday'}
                </Button>
              </div>

              {/* Add Holiday Form */}
              {showAddHoliday && (
                <div className="mb-8 p-6 bg-white/50 border border-white/20 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-light text-[#78716C] mb-1.5 block">Holiday Name</Label>
                      <Input
                        value={newHoliday.name}
                        onChange={e => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Christmas"
                        className="h-10 rounded-xl border-white/10 bg-white/30"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-light text-[#78716C] mb-1.5 block">Date</Label>
                      <Input
                        type="date"
                        value={newHoliday.date}
                        onChange={e => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                        className="h-10 rounded-xl border-white/10 bg-white/30"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddHoliday}
                    disabled={isSaving}
                    className="w-full bg-[#1C1917] text-white h-10 rounded-xl font-light"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm Add Holiday
                  </Button>
                </div>
              )}

              {/* Holidays List */}
              <div className="space-y-3">
                {holidays.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#E7E5E4] rounded-2xl">
                    <CalendarIcon className="w-8 h-8 text-[#D6D3D1] mx-auto mb-3" />
                    <p className="text-sm text-[#A8A29E] font-light">No holidays added yet.</p>
                  </div>
                ) : (
                  holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between py-4 px-5 bg-white/40 border-[0.5px] border-white/20 rounded-2xl group hover:bg-white/60 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-[#1C1917] font-medium">{holiday.name}</span>
                        <span className="text-xs text-[#78716C] font-light">{format(new Date(holiday.date), 'MMMM do, yyyy')}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="text-[#A8A29E] hover:text-[#F43F5E] opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 4: AI THRESHOLD SETTINGS ===== */}
          <TabsContent value="ai-thresholds">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">AI Threshold Settings</h2>
              <div className="space-y-6 max-w-xl">
                {/* Low Confidence Threshold */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Low Confidence Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.ai_low_confidence_threshold || 70}
                    onChange={e => handleUpdateSetting('ai_low_confidence_threshold', parseInt(e.target.value))}
                    placeholder="70"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Alert for tasks with confidence below this %
                  </div>
                </div>

                {/* Health Score Warning */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Health Score Warning</Label>
                  <Input
                    type="number"
                    value={settings.ai_health_score_warning || 60}
                    onChange={e => handleUpdateSetting('ai_health_score_warning', parseInt(e.target.value))}
                    placeholder="60"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Projects below this score show warnings
                  </div>
                </div>

                {/* Timeline Risk Days */}
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Timeline Risk Days</Label>
                  <Input
                    type="number"
                    value={settings.ai_timeline_risk_days || 7}
                    onChange={e => handleUpdateSetting('ai_timeline_risk_days', parseInt(e.target.value))}
                    placeholder="7"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Alert when predicted delay exceeds this many days
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 5: INTEGRATIONS (LIVE) ===== */}
          <TabsContent value="integrations">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Integrations</h2>

              <div className="p-8 border border-dashed border-[#E7E5E4] rounded-2xl text-center">
                <p className="text-[#A8A29E] font-light text-sm italic">
                  Advanced integrations are managed via the Jira & OAuth workflows. 
                  Contact support for custom Slack or Google Calendar enterprise setups.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Keeping placeholders for Team and AI Tabs to ensure nothing is removed */}
          <TabsContent value="team">
             <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
                <h2 className="text-xl font-light text-[#1C1917] mb-8">Team Settings</h2>
                <div className="space-y-6 max-w-xl">
                   <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Utilization Target</Label>
                   <Input type="number" placeholder="85" className="h-11 rounded-xl border-white/20 bg-white/50" />
                   <Button className="mt-8 bg-[#1C1917] text-white h-11 px-6 rounded-xl">Save Changes</Button>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="ai-thresholds">
             <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
                <h2 className="text-xl font-light text-[#1C1917] mb-8">AI Threshold Settings</h2>
                <div className="space-y-6 max-w-xl">
                   <Label className="text-sm font-light text-[#78716C] mb-2 block">Low Confidence Threshold</Label>
                   <Input type="number" placeholder="70" className="h-11 rounded-xl border-white/20 bg-white/50" />
                   <Button className="mt-8 bg-[#1C1917] text-white h-11 px-6 rounded-xl">Save Changes</Button>
                </div>
             </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default SettingsScreen;