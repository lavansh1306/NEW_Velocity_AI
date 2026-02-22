import React, { useState } from 'react';
import { VelocityAISidebar } from '@/components/dashboard/VelocityAISidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [orgData, setOrgData] = useState({
    organizationName: 'Acme Inc.',
    workHoursPerWeek: 40,
    workDaysPerWeek: 5,
    fiscalYearStart: 'January',
  });

  const [teamData, setTeamData] = useState({
    maxTeamSize: 50,
    defaultRole: 'Team Member',
  });

  const [holidays, setHolidays] = useState<Array<{ name: string; date: string }>>([
    { name: 'New Year', date: '2026-01-01' },
    { name: 'Independence Day', date: '2026-07-04' },
  ]);

  const [aiThresholds, setAiThresholds] = useState({
    utilizationThreshold: 85,
    riskThreshold: 60,
    warningThreshold: 70,
  });

  const handleOrgChange = (field: string, value: any) => {
    setOrgData({ ...orgData, [field]: value });
  };

  const handleTeamChange = (field: string, value: any) => {
    setTeamData({ ...teamData, [field]: value });
  };

  const handleAiChange = (field: string, value: any) => {
    setAiThresholds({ ...aiThresholds, [field]: value });
  };

  const handleSave = () => {
    console.log('Settings saved:', { orgData, teamData, holidays, aiThresholds });
    alert('Settings saved successfully!');
  };

  return (
    <VelocityAISidebar>
      <div className="px-8 py-6 max-w-6xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-light text-[#1C1917] tracking-tight mb-2">Settings</h1>
              <p className="text-[#78716C] font-light">Manage your organization, team, and system preferences</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="organization" className="w-full">
              <TabsList className="mb-8 bg-white border border-[#E7E5E4] p-1.5 rounded-xl shadow-sm inline-flex gap-1">
                <TabsTrigger 
                  value="organization" 
                  className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917] data-[state=inactive]:text-[#78716C]"
                >
                  Organization
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917] data-[state=inactive]:text-[#78716C]"
                >
                  Team
                </TabsTrigger>
                <TabsTrigger 
                  value="holidays" 
                  className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917] data-[state=inactive]:text-[#78716C]"
                >
                  Holidays
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-thresholds" 
                  className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917] data-[state=inactive]:text-[#78716C]"
                >
                  AI Thresholds
                </TabsTrigger>
                <TabsTrigger 
                  value="integrations" 
                  className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917] data-[state=inactive]:text-[#78716C]"
                >
                  Integrations
                </TabsTrigger>
              </TabsList>

              {/* Organization Tab */}
              <TabsContent value="organization" className="space-y-6">
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <h2 className="text-2xl font-light text-[#1C1917] mb-8">Organization Settings</h2>
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Organization Name</Label>
                      <Input 
                        value={orgData.organizationName}
                        onChange={(e) => handleOrgChange('organizationName', e.target.value)}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Hours Per Week</Label>
                      <Input 
                        type="number" 
                        value={orgData.workHoursPerWeek}
                        onChange={(e) => handleOrgChange('workHoursPerWeek', parseInt(e.target.value))}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Days Per Week</Label>
                      <Input 
                        type="number" 
                        value={orgData.workDaysPerWeek}
                        onChange={(e) => handleOrgChange('workDaysPerWeek', parseInt(e.target.value))}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Fiscal Year Start</Label>
                      <select 
                        value={orgData.fiscalYearStart}
                        onChange={(e) => handleOrgChange('fiscalYearStart', e.target.value)}
                        className="w-full border border-[#E7E5E4] bg-white rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#1C1917] focus:border-[#1C1917] focus:ring-[#1C1917]/10 focus:outline-none"
                      >
                        <option>January</option>
                        <option>February</option>
                        <option>March</option>
                        <option>April</option>
                        <option>May</option>
                        <option>June</option>
                        <option>July</option>
                        <option>August</option>
                        <option>September</option>
                        <option>October</option>
                        <option>November</option>
                        <option>December</option>
                      </select>
                    </div>
                    <Button 
                      onClick={handleSave}
                      className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-6">
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <h2 className="text-2xl font-light text-[#1C1917] mb-8">Team Settings</h2>
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Maximum Team Size</Label>
                      <Input 
                        type="number" 
                        value={teamData.maxTeamSize}
                        onChange={(e) => handleTeamChange('maxTeamSize', parseInt(e.target.value))}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Role for New Members</Label>
                      <select 
                        value={teamData.defaultRole}
                        onChange={(e) => handleTeamChange('defaultRole', e.target.value)}
                        className="w-full border border-[#E7E5E4] bg-white rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#1C1917] focus:border-[#1C1917] focus:ring-[#1C1917]/10 focus:outline-none"
                      >
                        <option>Team Member</option>
                        <option>Lead</option>
                        <option>Manager</option>
                        <option>Admin</option>
                      </select>
                    </div>
                    <Button 
                      onClick={handleSave}
                      className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Holidays Tab */}
              <TabsContent value="holidays" className="space-y-6">
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <h2 className="text-2xl font-light text-[#1C1917] mb-8">Holiday Calendar</h2>
                  <div className="space-y-6">
                    {holidays.map((holiday, idx) => (
                      <div key={idx} className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label className="text-sm font-light text-[#78716C] mb-2 block">Holiday Name</Label>
                          <Input 
                            value={holiday.name}
                            onChange={(e) => {
                              const updated = [...holidays];
                              updated[idx].name = e.target.value;
                              setHolidays(updated);
                            }}
                            className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-light text-[#78716C] mb-2 block">Date</Label>
                          <Input 
                            type="date"
                            value={holiday.date}
                            onChange={(e) => {
                              const updated = [...holidays];
                              updated[idx].date = e.target.value;
                              setHolidays(updated);
                            }}
                            className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                          />
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={handleSave}
                      className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* AI Thresholds Tab */}
              <TabsContent value="ai-thresholds" className="space-y-6">
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <h2 className="text-2xl font-light text-[#1C1917] mb-8">AI Alert Thresholds</h2>
                  <div className="space-y-6 max-w-2xl">
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Utilization Threshold (%)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={aiThresholds.utilizationThreshold}
                        onChange={(e) => handleAiChange('utilizationThreshold', parseInt(e.target.value))}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                      <p className="text-xs font-light text-[#78716C] mt-1">Alert when team utilization exceeds this percentage</p>
                    </div>
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Risk Threshold (%)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={aiThresholds.riskThreshold}
                        onChange={(e) => handleAiChange('riskThreshold', parseInt(e.target.value))}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                      <p className="text-xs font-light text-[#78716C] mt-1">Mark projects as at-risk if health score falls below this</p>
                    </div>
                    <div>
                      <Label className="text-sm font-light text-[#78716C] mb-2 block">Warning Threshold (%)</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="100"
                        value={aiThresholds.warningThreshold}
                        onChange={(e) => handleAiChange('warningThreshold', parseInt(e.target.value))}
                        className="h-11 rounded-xl border border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10 font-light"
                      />
                      <p className="text-xs font-light text-[#78716C] mt-1">Show warnings when health score is between risk and warning thresholds</p>
                    </div>
                    <Button 
                      onClick={handleSave}
                      className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-6">
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <h2 className="text-2xl font-light text-[#1C1917] mb-8">Integrations</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-[#E7E5E4] rounded-lg hover:bg-[#F5F5F4] transition-colors">
                      <div>
                        <p className="font-light text-[#1C1917]">Jira Integration</p>
                        <p className="text-xs font-light text-[#78716C]">Connect your Jira account for project management</p>
                      </div>
                      <Button className="bg-[#2DD4BF] hover:bg-[#14B8A6] h-10 px-4 rounded-lg font-light text-[#1C1917] transition-all duration-200">
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-[#E7E5E4] rounded-lg hover:bg-[#F5F5F4] transition-colors">
                      <div>
                        <p className="font-light text-[#1C1917]">Microsoft 365</p>
                        <p className="text-xs font-light text-[#78716C]">Sync with your Microsoft 365 calendar and emails</p>
                      </div>
                      <Button className="bg-[#2DD4BF] hover:bg-[#14B8A6] h-10 px-4 rounded-lg font-light text-[#1C1917] transition-all duration-200">
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-[#E7E5E4] rounded-lg hover:bg-[#F5F5F4] transition-colors">
                      <div>
                        <p className="font-light text-[#1C1917]">Slack Integration</p>
                        <p className="text-xs font-light text-[#78716C]">Receive alerts and notifications via Slack</p>
                      </div>
                      <Button className="bg-[#2DD4BF] hover:bg-[#14B8A6] h-10 px-4 rounded-lg font-light text-[#1C1917] transition-all duration-200">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
    </VelocityAISidebar>
  );
}
