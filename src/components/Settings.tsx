import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X, Copy, RefreshCw, Users } from 'lucide-react'; // Added icons
import { StatusBadge } from '@/components/shared/StatusBadge';

const SettingsScreen = () => {
  return (
    <div className="p-12 relative min-h-screen">
      <div className="max-w-[1200px] mx-auto relative z-10">

        <Tabs defaultValue="organization" className="w-full">
          {/* Tab Navigation */}
          <TabsList className="mb-10 bg-white/70 backdrop-blur-xl border border-white/20 p-1.5 rounded-xl shadow-sm">
            <TabsTrigger value="organization" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Organization</TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Team</TabsTrigger>
            <TabsTrigger value="holidays" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Holidays</TabsTrigger>
            <TabsTrigger value="ai-thresholds" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">AI Thresholds</TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg font-light data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Integrations</TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: ORGANIZATION SETTINGS ===== */}
          <TabsContent value="organization">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Organization Settings</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column: General Info */}
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Organization Name</Label>
                    <Input
                      placeholder="Acme Inc."
                      className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Hours Per Week</Label>
                    <Input
                      type="number"
                      placeholder="40"
                      className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Days Per Week</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-light text-[#78716C] mb-2 block">Fiscal Year Start</Label>
                    <select className="w-full border border-white/20 bg-white/50 rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#292524]">
                      <option>January</option>
                      <option>April</option>
                      <option>July</option>
                      <option>October</option>
                    </select>
                  </div>

                  <Button className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">
                    Save Changes
                  </Button>
                </div>

                {/* Right Column: Invite Code & Membership (New Section) */}
                <div className="space-y-6 p-8 rounded-2xl bg-stone-50/50 border border-stone-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-[#1C1917]" />
                    <h3 className="text-sm font-medium text-[#1C1917]">Team Recruitment</h3>
                  </div>

                  {/* Invite Code Display */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-light text-[#78716C] mb-2 block">Organization Invite Code</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            readOnly
                            value="ACME-2026-XP92" // Placeholder for invite_code
                            className="h-11 pr-10 rounded-xl border-white/20 bg-white font-mono text-xs tracking-wider"
                          />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917]">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-white/20 bg-white">
                          <RefreshCw className="w-4 h-4 text-[#78716C]" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-[#A8A29E] mt-2 italic">
                        Usage count: 12 members joined via this code
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-[#78716C]">Invite Status</span>
                        <StatusBadge status="Active" /> {/* Based on invite_is_active */}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#78716C]">Default Joining Role</span>
                        <span className="text-xs font-medium text-[#1C1917] capitalize">Employee</span> 
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
              <div className="space-y-6 max-w-xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Utilization Target</Label>
                  <Input
                    type="number"
                    placeholder="85"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Target utilization percentage for team members
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Overload Threshold</Label>
                  <Input
                    type="number"
                    placeholder="110"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Alert when utilization exceeds this percentage
                  </div>
                </div>

                <Button className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 3: COMPANY HOLIDAYS ===== */}
          <TabsContent value="holidays">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-light text-[#1C1917]">Company Holidays</h2>
                <Button
                  size="sm"
                  className="bg-[#1C1917] hover:bg-[#292524] h-10 px-5 rounded-xl font-light transition-all duration-300 text-white shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </div>

              <div className="space-y-3">
                {[
                  "New Year's Day - Jan 1, 2026",
                  "Memorial Day - May 25, 2026",
                  "Independence Day - Jul 4, 2026",
                  "Thanksgiving - Nov 26, 2026"
                ].map((holiday, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-4 px-5 bg-white/40 border-[0.5px] border-white/20 rounded-2xl"
                  >
                    <span className="text-sm text-[#1C1917] font-light">{holiday}</span>
                    <button className="text-[#A8A29E] hover:text-[#78716C] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 4: AI THRESHOLD SETTINGS ===== */}
          <TabsContent value="ai-thresholds">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">AI Threshold Settings</h2>
              <div className="space-y-6 max-w-xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Low Confidence Threshold</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Alert for tasks with confidence below this %
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Health Score Warning</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Projects below this score show warnings
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Timeline Risk Days</Label>
                  <Input
                    type="number"
                    placeholder="7"
                    className="h-11 rounded-xl border-white/20 bg-white/50 font-light"
                  />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">
                    Alert when predicted delay exceeds this many days
                  </div>
                </div>

                <Button className="mt-8 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md">
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 5: INTEGRATIONS ===== */}
          <TabsContent value="integrations">
            <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-10 shadow-sm">
              <h2 className="text-xl font-light text-[#1C1917] mb-8">Integrations</h2>

              <div className="space-y-4">
                {[
                  { name: 'Jira', description: 'Import projects and track tasks', connected: true },
                  { name: 'Asana', description: 'Sync project management data', connected: false },
                  { name: 'Slack', description: 'Get notifications and updates', connected: true },
                  { name: 'Google Calendar', description: 'Sync team schedules', connected: false },
                ].map((integration, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-5 px-6 bg-white/40 border border-white/20 rounded-2xl"
                  >
                    <div>
                      <div className="text-[#292524] text-sm mb-1.5 font-light">{integration.name}</div>
                      <div className="text-xs text-[#78716C] font-light">{integration.description}</div>
                    </div>

                    {integration.connected ? (
                      <div className="flex items-center gap-4">
                        <StatusBadge status="Active" />
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-9 px-4 rounded-xl font-light border-white/20 hover:bg-white transition-all duration-300"
                        >
                          Configure
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-[#1C1917] hover:bg-[#292524] h-9 px-5 rounded-xl font-light transition-all duration-300 text-white shadow-md"
                      >
                        Connect
                      </Button>
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