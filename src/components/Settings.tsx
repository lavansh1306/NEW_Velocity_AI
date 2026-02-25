import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'Active': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'At Risk': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    'Delayed': 'bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]',
    'Completed': 'bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]',
    'Healthy': 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    'Overloaded': 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    'Not Started': 'bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]',
    'In Progress': 'bg-white text-[#1C1917] border border-[#E7E5E4]',
    'Inactive': 'bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-light ${variants[status] || 'bg-[#F5F5F4] text-[#78716C] border border-[#E7E5E4]'}`}>
      {status}
    </span>
  );
};

export function Settings() {
  return (
    <div className="p-8 min-h-screen bg-white">      
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-light text-[#1C1917] mb-2">Settings</h1>
        <p className="text-[#78716C] mb-8">Manage your organization, team, and system settings</p>
        
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="mb-8 bg-white border border-[#E7E5E4] p-1.5 rounded-xl shadow-sm">
            <TabsTrigger 
              value="organization" 
              className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917]"
            >
              Organization
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917]"
            >
              Team
            </TabsTrigger>
            <TabsTrigger 
              value="holidays" 
              className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917]"
            >
              Holidays
            </TabsTrigger>
            <TabsTrigger 
              value="ai-thresholds" 
              className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917]"
            >
              AI Thresholds
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="rounded-lg font-light data-[state=active]:bg-[#F5F5F4] data-[state=active]:text-[#1C1917]"
            >
              Integrations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="organization" className="space-y-6">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-light text-[#1C1917] mb-6">Organization Settings</h2>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Organization Name</Label>
                  <Input placeholder="Acme Inc." className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Hours Per Week</Label>
                  <Input type="number" placeholder="40" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Work Days Per Week</Label>
                  <Input type="number" placeholder="5" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Fiscal Year Start</Label>
                  <select className="w-full border border-[#E7E5E4] bg-white rounded-xl px-4 py-2.5 text-sm font-light h-11 text-[#1C1917] focus:border-[#1C1917] focus:ring-[#1C1917]/10">
                    <option>January</option>
                    <option>April</option>
                    <option>July</option>
                    <option>October</option>
                  </select>
                </div>
                <Button className="mt-6 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm">
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="team" className="space-y-6">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-light text-[#1C1917] mb-6">Team Settings</h2>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Default Utilization Target</Label>
                  <Input type="number" placeholder="85" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Target utilization percentage for team members</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Overload Threshold</Label>
                  <Input type="number" placeholder="110" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Alert when utilization exceeds this percentage</div>
                </div>
                <Button className="mt-6 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm">
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="holidays" className="space-y-6">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-[#1C1917]">Company Holidays</h2>
                <Button size="sm" className="bg-[#1C1917] hover:bg-[#292524] h-10 px-5 rounded-xl font-light transition-all duration-200 text-white shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </div>
              <div className="space-y-3">
                {['New Year\'s Day - Jan 1, 2026', 'Memorial Day - May 25, 2026', 'Independence Day - Jul 4, 2026', 'Thanksgiving - Nov 26, 2026'].map((holiday, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 px-4 bg-white border border-[#E7E5E4] rounded-xl hover:bg-[#F5F5F4] transition-colors">
                    <span className="text-sm text-[#1C1917] font-light">{holiday}</span>
                    <button className="text-[#A8A29E] hover:text-[#78716C] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai-thresholds" className="space-y-6">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-light text-[#1C1917] mb-6">AI Threshold Settings</h2>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Low Confidence Threshold</Label>
                  <Input type="number" placeholder="70" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Alert for tasks with confidence below this %</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Health Score Warning</Label>
                  <Input type="number" placeholder="60" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Projects below this score show warnings</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-[#78716C] mb-2 block">Timeline Risk Days</Label>
                  <Input type="number" placeholder="7" className="h-11 rounded-xl border-[#E7E5E4] focus:border-[#1C1917] focus:ring-[#1C1917]/10" />
                  <div className="text-xs text-[#A8A29E] font-light mt-2">Alert when predicted delay exceeds this many days</div>
                </div>
                <Button className="mt-6 bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-200 text-white shadow-sm">
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="integrations" className="space-y-6">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-light text-[#1C1917] mb-6">Integrations</h2>
              <div className="space-y-4">
                {[
                  { name: 'Jira', description: 'Import projects and track tasks', connected: true },
                  { name: 'Asana', description: 'Sync project management data', connected: false },
                  { name: 'Slack', description: 'Get notifications and updates', connected: true },
                  { name: 'Google Calendar', description: 'Sync team schedules', connected: false },
                ].map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between py-4 px-5 bg-white border border-[#E7E5E4] rounded-xl hover:bg-[#F5F5F4] transition-colors">
                    <div>
                      <div className="text-[#1C1917] text-sm mb-1 font-light">{integration.name}</div>
                      <div className="text-xs text-[#78716C] font-light">{integration.description}</div>
                    </div>
                    {integration.connected ? (
                      <div className="flex items-center gap-3">
                        <StatusBadge status="Active" />
                        <Button size="sm" variant="outline" className="text-xs h-9 px-4 rounded-xl font-light border-[#E7E5E4] hover:bg-[#F5F5F4] transition-all duration-200">
                          Configure
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="bg-[#1C1917] hover:bg-[#292524] h-9 px-5 rounded-xl font-light transition-all duration-200 text-white shadow-sm">
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
}
