import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, X, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchAllIssuesHybrid } from '@/lib/jiraDbClient';
import { supabase } from '@/lib/supabase';
import { getCurrentOrgId } from '@/lib/orgContext';

// ==================== TYPE DEFINITIONS ====================

interface TeamMember {
  email: string;
  name: string;
  role: string;
  skills: string[];
  utilization: number;
  totalHours: number;
  availableCapacity: number;
  issueCount: number;
  projects: number;
  status: 'healthy' | 'overloaded' | 'at-risk';
  avatar?: string;
  availability?: number;
}

interface PersonDetails {
  email: string;
  name: string;
  role: string;
  avatar: string;
  utilization: number;
  capacityTimeline: Array<{ week: string; allocated: number; available: number }>;
  projects: Array<{ name: string; hours: number }>;
  skills: Array<{ name: string; proficiency: number }>;
  recommendations: Array<{ text: string; action: string }>;
}

// ==================== UI COMPONENTS ====================

const UtilizationBar = ({ value }: { value: number }) => {
  const color = value > 110 ? 'bg-[#E27052]' : value > 90 ? 'bg-[#E27052]' : 'bg-[#88A67E]';
  const width = Math.min(value, 150);
  
  return (
    <div className="w-full bg-[#FAFAF9] rounded-full h-1.5 overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

// ==================== ADD TEAM MEMBER MODAL ====================

const AddTeamMemberModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState('');
  const [utilization, setUtilization] = useState(85);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl bg-[#FDFDFB] p-0 gap-0">
        <DialogHeader className="px-8 py-6 border-b border-[#E5E5E5] bg-white">
          <DialogTitle className="text-xl font-medium text-[#121212]">Add Team Member</DialogTitle>
        </DialogHeader>
        
        <div className="p-8 grid grid-cols-2 gap-8">
          <div className="space-y-4">
             <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="e.g. Jane Doe" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="jane@example.com" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-10 border-[#E5E5E5] bg-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend Developer</SelectItem>
                  <SelectItem value="backend">Backend Developer</SelectItem>
                  <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                  <SelectItem value="designer">Product Designer</SelectItem>
                  <SelectItem value="pm">Product Manager</SelectItem>
                  <SelectItem value="qa">QA Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Skills (comma separated)</Label>
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} className="h-10 border-[#E5E5E5] bg-white" placeholder="React, Node.js, etc." />
            </div>
          </div>
          
          <div className="col-span-2 space-y-2">
             <div className="flex justify-between">
                <Label className="text-xs font-medium text-[#737373] uppercase tracking-wide">Target Utilization</Label>
                <span className="text-xs font-medium text-[#121212]">{utilization}%</span>
             </div>
             <input 
               type="range" 
               min="0" 
               max="120" 
               value={utilization} 
               onChange={(e) => setUtilization(parseInt(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
             />
          </div>
        </div>

        <DialogFooter className="px-8 py-5 border-t border-[#E5E5E5] bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#E5E5E5] text-[#737373] hover:text-[#121212]">Cancel</Button>
          <Button onClick={() => onOpenChange(false)} className="bg-[#121212] text-white hover:bg-[#262626] shadow-sm px-6">Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN PEOPLE CAPACITY SCREEN ====================

export default function PeopleCapacityTab() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [allTeam, setAllTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<TeamMember | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [capacityStartDate, setCapacityStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [memberMap, setMemberMap] = useState<Map<string, any>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    avgUtilization: 0,
    overloadedCount: 0,
    availableCapacity: 0
  });

  // Helper function to check if an issue falls within a 2-week window
  const issueFallsInRange = (issue: any, startDate: string): boolean => {
    // Try to get a valid date from the issue
    let dateStr = issue.dueDate || issue.due_date || issue.created || issue.created_date;
    
    // If no date found, include it anyway (all issues)
    if (!dateStr) {
      return true;
    }

    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(end.getDate() + 14);
      end.setHours(23, 59, 59, 999);
      
      // Parse issue date - handle different formats
      let issueDate = new Date(dateStr);
      
      // If date parsing failed, include it by default
      if (isNaN(issueDate.getTime())) {
        console.warn('[PeopleCapacity] Invalid date:', dateStr);
        return true;
      }
      
      issueDate.setHours(0, 0, 0, 0);
      
      const isInRange = issueDate >= start && issueDate <= end;
      
      // Log first few issues to debug date range filtering
      if (window.__debugIssuesLogged === undefined) window.__debugIssuesLogged = 0;
      if (window.__debugIssuesLogged < 15) {
        console.log('[PeopleCapacity] Checking issue date:', {
          issue: issue.key || issue.issue_key || 'unknown',
          rawDate: dateStr,
          issueDate: issueDate.toISOString().split('T')[0],
          rangeStart: start.toISOString().split('T')[0],
          rangeEnd: end.toISOString().split('T')[0],
          inRange: isInRange
        });
        window.__debugIssuesLogged++;
      }
      
      return isInRange;
    } catch (error) {
      console.warn('[PeopleCapacity] Error checking date range:', {
        dateStr,
        error: error instanceof Error ? error.message : String(error)
      });
      return true; // Include by default if there's an error
    }
  };

  // Recalculate team data based on date range
  const recalculateTeamForDateRange = (startDate: string) => {
    console.log('[PeopleCapacity] recalculateTeamForDateRange called with:', {
      startDate,
      allIssuesCount: allIssues.length,
      allTeamCount: allTeam.length
    });

    // If we have no team members at all, return
    if (allTeam.length === 0) {
      console.log('[PeopleCapacity] No team members to calculate');
      return;
    }

    const CAPACITY_PER_PERSON = 160;
    
    // Calculate hours for each team member based on issues in the selected date range
    const filteredTeam = allTeam.map(member => {
      let hoursInRange = 0;
      let issueCountInRange = 0;
      const projectsSet = new Set<string>();

      // Sum up hours only for issues within the selected date range
      allIssues.forEach((issue: any) => {
        const assignee = issue.assigneeEmail || issue.assignee || 'Unassigned';
        
        // Check if this issue is assigned to this team member AND falls in the date range
        if (assignee === member.email && issueFallsInRange(issue, startDate)) {
          issueCountInRange += 1;
          
          if (issue.projectName) {
            projectsSet.add(issue.projectName);
          }

          const estimate = issue.timeestimate_seconds
            ? Math.round(issue.timeestimate_seconds / 3600)
            : issue.story_points
            ? issue.story_points * 4
            : 4;

          hoursInRange += estimate;
        }
      });

      const utilization = (hoursInRange / CAPACITY_PER_PERSON) * 100;
      let status: 'healthy' | 'overloaded' | 'at-risk' = 'healthy';
      
      if (utilization > 110) {
        status = 'overloaded';
      } else if (utilization > 90) {
        status = 'at-risk';
      }

      console.log(`[PeopleCapacity] ${member.name}: ${hoursInRange}h in range, utilization: ${Math.round(utilization)}%`);

      return {
        ...member,
        totalHours: hoursInRange,
        utilization: Math.round(utilization),
        availableCapacity: Math.max(0, CAPACITY_PER_PERSON - hoursInRange),
        issueCount: issueCountInRange,
        projects: projectsSet.size > 0 ? projectsSet.size : member.projects,
        status
      };
    });

    console.log('[PeopleCapacity] Final filtered team for date', startDate, ':', filteredTeam.map(m => ({
      name: m.name,
      utilization: m.utilization,
      availableCapacity: m.availableCapacity,
      totalHours: m.totalHours
    })));
    
    const sortedTeam = filteredTeam.sort((a, b) => b.utilization - a.utilization);
    setTeam(sortedTeam);
    
    const newMetrics = calculateMetrics(sortedTeam);
    console.log('[PeopleCapacity] Updated metrics for date', startDate, ':', newMetrics);
    setMetrics(newMetrics);
  };

  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to calculate capacity timeline based on selected date
  const getCapacityTimeline = (startDate: string, totalHours: number) => {
    const start = new Date(startDate);
    const timeline = [];
    
    for (let i = 0; i < 2; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const allocated = Math.round(totalHours * (i === 0 ? 0.5 : 0.5));
      
      timeline.push({
        week: weekLabel,
        allocated,
        available: 40
      });
    }
    
    return timeline;
  };

  // Load person details when a person is selected
  useEffect(() => {
    if (selectedPerson) {
      // Build person details from the selected member
      const details: PersonDetails = {
        email: selectedPerson.email,
        name: selectedPerson.name,
        role: selectedPerson.role || '—',
        avatar: selectedPerson.avatar || getInitials(selectedPerson.name),
        utilization: selectedPerson.utilization,
        capacityTimeline: getCapacityTimeline(capacityStartDate, selectedPerson.totalHours),
        projects: [], // Will be populated from actual Jira data
        skills: selectedPerson.skills.length > 0 && selectedPerson.skills[0] !== '—' 
          ? selectedPerson.skills.map((skill) => ({
              name: skill,
              proficiency: 85
            }))
          : [{ name: '—', proficiency: 0 }],
        recommendations: selectedPerson.utilization > 100 
          ? [
              { text: `Redistribute 8-10 hours to other team members`, action: 'Apply' },
              { text: `Consider task prioritization for ${selectedPerson.name}`, action: 'Apply' },
            ]
          : [
              { text: `${selectedPerson.name} has capacity for 1-2 additional tasks`, action: 'Apply' },
            ]
      };

      // Fetch actual project assignments from Jira
      fetchAllIssuesHybrid().then(({ issues }) => {
        const projectHoursMap = new Map<string, number>();
        issues.forEach((issue: any) => {
          if ((issue.assigneeEmail === selectedPerson.email || issue.assignee === selectedPerson.email) && issue.projectName) {
            const hours = projectHoursMap.get(issue.projectName) || 0;
            const estimate = issue.timeestimate_seconds
              ? Math.round(issue.timeestimate_seconds / 3600)
              : issue.story_points
              ? issue.story_points * 4
              : 4;
            projectHoursMap.set(issue.projectName, hours + estimate);
          }
        });

        if (projectHoursMap.size > 0) {
          details.projects = Array.from(projectHoursMap.entries()).map(([name, hours]) => ({
            name: name || '—',
            hours: hours
          }));
        } else {
          details.projects = [{ name: '—', hours: 0 }];
        }

        setPersonDetails({ ...details });
      }).catch(() => {
        details.projects = [{ name: '—', hours: 0 }];
        setPersonDetails(details);
      });

      setPersonDetails(details);
    }
  }, [selectedPerson, capacityStartDate]);

  // Helper function to calculate metrics for a filtered team list
  const calculateMetrics = (teamData: TeamMember[]) => {
    const CAPACITY_PER_PERSON = 160;
    let totalUtilization = 0;
    let overloadedCount = 0;
    let totalAvailableCapacity = 0;

    teamData.forEach((person) => {
      totalUtilization += person.utilization;
      if (person.utilization > 100) overloadedCount++;
      totalAvailableCapacity += person.availableCapacity;
    });

    const avgUtilization = teamData.length > 0 ? Math.round(totalUtilization / teamData.length) : 0;
    return {
      totalMembers: teamData.length,
      avgUtilization,
      overloadedCount,
      availableCapacity: Math.round(totalAvailableCapacity)
    };
  };

  // Function to refresh data when date changes
  const refreshDataForDate = async () => {
    setIsRefreshing(true);
    try {
      const orgId = getCurrentOrgId();
      if (!orgId) return;

      console.log('[PeopleCapacity] Refreshing data for date:', analyticsStartDate);

      // First, try to fetch issues from database
      const { data: dbIssues, error: dbError } = await supabase
        .from('jira_issues')
        .select('*')
        .not('assignee', 'is', null);

      let freshIssues: any[] = [];
      if (!dbError && dbIssues && dbIssues.length > 0) {
        console.log('[PeopleCapacity] Loaded', dbIssues.length, 'issues from database');
        // Transform database issues to match the expected format
        freshIssues = dbIssues.map((issue: any) => ({
          key: issue.issue_key,
          summary: issue.summary,
          assignee: issue.assignee,
          assigneeEmail: issue.assignee,
          assigneeName: issue.assignee,
          projectName: issue.project_key,
          status: issue.status,
          dueDate: issue.due_date,
          created: issue.created_date,
          timeestimate_seconds: 0,
          story_points: 0
        }));
      } else {
        // Fallback to Jira API
        console.log('[PeopleCapacity] Database query failed or empty, falling back to Jira API');
        const { issues: jiraIssues, source } = await fetchAllIssuesHybrid();
        console.log(`[PeopleCapacity] Loaded ${jiraIssues.length} issues from ${source}`);
        freshIssues = jiraIssues;
      }

      // Fetch team members from database
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id, email, display_name, role, skills')
        .eq('org_id', orgId);

      if (memberError) {
        console.warn('[PeopleCapacity] Error fetching members:', memberError);
      }

      const newMemberMap = new Map<string, any>();
      (memberData || []).forEach((member: any) => {
        newMemberMap.set(member.email, {
          dbId: member.id,
          displayName: member.display_name || member.email.split('@')[0],
          dbRole: member.role || 'employee',
          dbSkills: Array.isArray(member.skills) ? member.skills : []
        });
      });

      console.log('[PeopleCapacity] Updating state with', freshIssues.length, 'issues and', newMemberMap.size, 'members');
      setAllIssues(freshIssues);
      setMemberMap(newMemberMap);
      
      // The useEffect will automatically trigger recalculation when allIssues/allTeam changes
    } catch (error) {
      console.error('[PeopleCapacity] Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Recalculate team data when analytics date changes or team/issues data updates
  useEffect(() => {
    console.log('[PeopleCapacity] useEffect triggered for date change/data update');
    recalculateTeamForDateRange(analyticsStartDate);
  }, [analyticsStartDate, allTeam, allIssues]);

  useEffect(() => {
    const loadPeopleCapacityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const orgId = getCurrentOrgId();
        if (!orgId) {
          console.warn('[PeopleCapacity] No org_id set');
          setAllTeam([]);
          setTeam([]);
          setLoading(false);
          return;
        }

        console.log('[PeopleCapacity] Fetching from DB with database-first approach');
        
        // First, try to fetch issues from database
        const { data: dbIssues, error: dbError } = await supabase
          .from('jira_issues')
          .select('*')
          .not('assignee', 'is', null);

        let allIssuesData: any[] = [];
        if (!dbError && dbIssues && dbIssues.length > 0) {
          console.log('[PeopleCapacity] Loaded', dbIssues.length, 'issues from database');
          // Transform database issues to match the expected format
          allIssuesData = dbIssues.map((issue: any) => ({
            key: issue.issue_key,
            summary: issue.summary,
            assignee: issue.assignee,
            assigneeEmail: issue.assignee,
            assigneeName: issue.assignee,
            projectName: issue.project_key,
            status: issue.status,
            dueDate: issue.due_date,
            created: issue.created_date,
            timeestimate_seconds: 0,
            story_points: 0
          }));
        } else {
          // Fallback to Jira API
          console.log('[PeopleCapacity] Database query failed or empty, falling back to Jira API');
          const { issues: jiraIssues, source } = await fetchAllIssuesHybrid();
          console.log(`[PeopleCapacity] Received ${jiraIssues.length} issues from ${source}`);
          allIssuesData = jiraIssues;
        }

        // Fetch team members with their skills from organization_members table
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('id, email, display_name, role, skills')
          .eq('org_id', orgId);

        if (memberError) {
          console.warn('[PeopleCapacity] Error fetching members:', memberError);
        }

        const newMemberMap = new Map<string, any>();
        (memberData || []).forEach((member: any) => {
          newMemberMap.set(member.email, {
            dbId: member.id,
            displayName: member.display_name || member.email.split('@')[0],
            dbRole: member.role || 'employee',
            dbSkills: Array.isArray(member.skills) ? member.skills : []
          });
        });
        setMemberMap(newMemberMap);

        if (!Array.isArray(allIssuesData) || allIssuesData.length === 0) {
          console.warn('[PeopleCapacity] No issues found');
          setAllTeam([]);
          setTeam([]);
          setLoading(false);
          return;
        }

        // Group issues by assignee
        const teamMap = new Map<string, TeamMember>();
        const projectMap = new Map<string, Set<string>>();
        const CAPACITY_PER_PERSON = 160;

        allIssuesData.forEach((issue: any) => {
          const assignee = issue.assigneeEmail || issue.assignee || 'Unassigned';
          if (assignee === 'Unassigned') return;

          // Get member data from DB, fallback to Jira data
          const memberData = newMemberMap.get(assignee);
          const displayName = memberData?.displayName || issue.assigneeName || assignee.split('@')[0] || 'Unknown';
          const skills = memberData?.dbSkills?.length > 0 ? memberData.dbSkills : ['—'];
          const dbRole = memberData?.dbRole || 'employee';

          if (!teamMap.has(assignee)) {
            teamMap.set(assignee, {
              email: assignee,
              name: displayName,
              role: dbRole,
              skills: skills,
              utilization: 0,
              totalHours: 0,
              availableCapacity: 0,
              issueCount: 0,
              projects: 0,
              status: 'healthy',
              avatar: getInitials(displayName)
            });
            projectMap.set(assignee, new Set<string>());
          }

          const person = teamMap.get(assignee)!;
          person.issueCount += 1;

          // Track projects assigned
          if (issue.projectName) {
            projectMap.get(assignee)!.add(issue.projectName);
          }

          const estimate = issue.timeestimate_seconds
            ? Math.round(issue.timeestimate_seconds / 3600)
            : issue.story_points
            ? issue.story_points * 4
            : 4;

          person.totalHours += estimate;
        });

        const teamArray = Array.from(teamMap.values());
        const totalMembers = teamArray.length;

        console.log(`[PeopleCapacity] Processed ${totalMembers} team members`);

        teamArray.forEach((person) => {
          const utilization = (person.totalHours / CAPACITY_PER_PERSON) * 100;
          person.utilization = Math.round(utilization);
          person.availableCapacity = Math.max(0, CAPACITY_PER_PERSON - person.totalHours);
          person.projects = projectMap.get(person.email)?.size || person.issueCount;

          // Determine status
          if (person.utilization > 110) {
            person.status = 'overloaded';
          } else if (person.utilization > 90) {
            person.status = 'at-risk';
          } else {
            person.status = 'healthy';
          }
        });

        setAllIssues(allIssuesData);
        setAllTeam(teamArray.sort((a, b) => b.utilization - a.utilization));
        setTeam(teamArray.sort((a, b) => b.utilization - a.utilization));
        setMetrics(calculateMetrics(teamArray));
        setLoading(false);
      } catch (error) {
        console.error('[PeopleCapacity] Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadPeopleCapacityData();
    const interval = setInterval(loadPeopleCapacityData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-12 min-h-screen bg-[#FAFAF9]">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-1">Error Loading Data</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 relative min-h-screen bg-[#FAFAF9]">
      {/* Gradient Background */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(120px)',
          opacity: 0.4,
        }}
      />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        
        {/* ===== HEADER SECTION ===== */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light text-[#1C1917] tracking-tight">People & Capacity</h1>
          <Button 
            className="bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md"
            onClick={() => setIsAddMemberOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>
        
        <AddTeamMemberModal open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen} />
        
        {/* ===== CAPACITY SUMMARY STRIP ===== */}
        <div className="flex items-center gap-0 mb-10">
          <div className="flex-1 py-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">{metrics.totalMembers}</div>
            <div className="text-sm text-[#78716C] font-light">Total Members</div>
          </div>
          <div className="w-px h-16 bg-[#E7E5E4]"></div>
          <div className="flex-1 py-8 px-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">{metrics.avgUtilization}%</div>
            <div className="text-sm text-[#78716C] font-light">Avg Utilization</div>
          </div>
          <div className="w-px h-16 bg-[#E7E5E4]"></div>
          <div className="flex-1 py-8 px-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">{metrics.overloadedCount}</div>
            <div className="text-sm text-[#78716C] font-light">Overloaded Count</div>
          </div>
          <div className="w-px h-16 bg-[#E7E5E4]"></div>
          <div className="flex-1 py-8 pl-8">
            <div className="text-4xl font-light text-[#1C1917] mb-2">{metrics.availableCapacity}h</div>
            <div className="text-sm text-[#78716C] font-light">Available Capacity</div>
          </div>
        </div>

        {/* ===== DATE FILTER SECTION ===== */}
        <div className="mb-8 p-6 bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-sm font-light text-[#292524] mb-1">Filter by Date Range</div>
              <div className="text-xs text-[#78716C]">Select a start date to view analytics for the next 2 weeks</div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <Label className="text-xs font-light text-[#78716C] uppercase tracking-wide mb-2 block">Start Date</Label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={analyticsStartDate}
                    onChange={(e) => {
                      setAnalyticsStartDate(e.target.value);
                      refreshDataForDate();
                    }}
                    className="px-3 py-2 border border-[#E7E5E4] rounded-lg bg-white text-sm font-light text-[#292524] hover:border-[#D6D3D1] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 focus:border-[#2DD4BF]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      setAnalyticsStartDate(today.toISOString().split('T')[0]);
                      setTimeout(() => refreshDataForDate(), 0);
                    }}
                    className="border-[#E7E5E4] text-[#78716C] hover:text-[#292524] font-light h-10 px-3"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshDataForDate}
                    disabled={isRefreshing}
                    className="border-[#E7E5E4] text-[#78716C] hover:text-[#292524] font-light h-10 px-3 disabled:opacity-60"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              <div className="pt-6">
                <span className="text-xs text-[#78716C] font-light">
                  to {new Date(new Date(analyticsStartDate).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ===== TEAM TABLE ===== */}
        {loading ? (
          <div className="text-center py-16 bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl">
            <div className="text-[#78716C] font-light">Loading team data...</div>
          </div>
        ) : team.length > 0 ? (
          <div className="bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl p-8 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b-[0.5px] border-white/20">
                  <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Name</th>
                  <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Role</th>
                  <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Skills</th>
                  <th className="text-left py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Utilization</th>
                  <th className="text-center py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Projects</th>
                  <th className="text-center py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-4 text-xs font-light text-[#78716C] uppercase tracking-wider">Next 2 Weeks</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-white/10 hover:bg-[#FAFAF9]/40 cursor-pointer transition-all duration-300"
                    onClick={() => setSelectedPerson(member)}
                  >
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-white/20 shadow-sm">
                          <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-sm font-light">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm text-[#292524] font-light">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-sm text-[#78716C] font-light">{member.role}</td>
                    <td className="py-5 px-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {member.skills.slice(0, 2).map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white/60 border border-white/20 text-[#292524] text-xs rounded-full font-light shadow-sm">
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 2 && (
                          <span className="px-2.5 py-1 bg-white/60 border border-white/20 text-[#78716C] text-xs rounded-full font-light shadow-sm">
                            +{member.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <UtilizationBar value={member.utilization} />
                        </div>
                        <span className={`text-sm font-light ${member.utilization > 110 ? 'text-rose-600' : 'text-[#292524]'}`}>
                          {member.utilization}%
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center text-sm text-[#292524] font-light">{member.projects}</td>
                    <td className="py-5 px-4 text-center">
                      <div className="flex justify-center">
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'overloaded' ? 'bg-rose-400' :
                          member.status === 'at-risk' ? 'bg-yellow-400' :
                          'bg-emerald-400'
                        }`} />
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right text-sm text-[#292524] font-light">{Math.round(member.availableCapacity / 2)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/70 backdrop-blur-[32px] border-[0.5px] border-white/20 rounded-2xl">
            <AlertCircle className="w-16 h-16 text-[#D6D3D1] mx-auto mb-4" />
            <p className="text-[#78716C] font-light">No team members found</p>
            <p className="text-sm text-[#A8A29E] mt-1">Connect to Jira to see capacity data</p>
          </div>
        )}
      </div>
      
      {/* ===== RIGHT DRAWER (PERSON DETAILS) ===== */}
      {selectedPerson && personDetails && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedPerson(null)}
          />
          <div className="fixed right-0 top-0 h-full w-[420px] bg-white/80 backdrop-blur-2xl shadow-2xl z-50 overflow-y-auto border-l border-white/20">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border border-white/20 shadow-md">
                    <AvatarFallback className="bg-[#F5F5F4] text-[#1C1917] text-xl font-light">
                      {personDetails.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-light text-[#292524] mb-1">{personDetails.name}</div>
                    <div className="text-sm text-[#78716C] font-light">{personDetails.role}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="text-[#A8A29E] hover:text-[#78716C] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Date Picker for Capacity Timeline */}
              <div className="mb-8">
                <Label className="text-xs font-light text-[#78716C] uppercase tracking-wide mb-3 block">Timeline Start Date</Label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={capacityStartDate}
                    onChange={(e) => setCapacityStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#E7E5E4] rounded-lg bg-white text-sm font-light text-[#292524] hover:border-[#D6D3D1] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/20 focus:border-[#2DD4BF]"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      setCapacityStartDate(today.toISOString().split('T')[0]);
                    }}
                    className="border-[#E7E5E4] text-[#78716C] hover:text-[#292524] font-light h-10 px-3"
                  >
                    Today
                  </Button>
                </div>
              </div>
              
              {/* Utilization Section */}
              <div className="mb-8">
                <div className="text-xs text-[#78716C] font-light mb-2">Current Utilization</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <UtilizationBar value={personDetails.utilization} />
                  </div>
                  <span className={`text-sm font-light ${personDetails.utilization > 110 ? 'text-rose-600' : 'text-[#292524]'}`}>
                    {personDetails.utilization}%
                  </span>
                </div>
              </div>
              
              {/* Capacity Timeline Section */}
              <div className="mb-8">
                <div className="text-sm font-light text-[#292524] mb-4">Next 2 Weeks Capacity</div>
                <div className="space-y-3">
                  {personDetails.capacityTimeline.map((week, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs text-[#78716C] font-light mb-1.5">
                        <span>{week.week}</span>
                        <span>{week.allocated}h / {week.available}h</span>
                      </div>
                      <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            week.allocated > week.available ? 'bg-rose-400' : 'bg-[#2DD4BF]'
                          }`}
                          style={{ width: `${Math.min((week.allocated / week.available) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Assigned Projects Section */}
              <div className="mb-8">
                <div className="text-sm font-light text-[#292524] mb-4">Assigned Projects</div>
                <div className="space-y-3">
                  {personDetails.projects && personDetails.projects.length > 0 ? (
                    personDetails.projects.map((project, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 px-4 bg-white/50 border border-white/20 rounded-xl">
                        <div className="text-sm text-[#292524] font-light">{project.name}</div>
                        <div className="text-sm text-[#78716C] font-light">{project.hours > 0 ? `${project.hours}h/wk` : '—'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between py-3 px-4 bg-white/50 border border-white/20 rounded-xl">
                      <div className="text-sm text-[#78716C] font-light">—</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Skills Section */}
              <div className="mb-8">
                <div className="text-sm font-light text-[#292524] mb-4">Skills</div>
                <div className="space-y-3">
                  {personDetails.skills && personDetails.skills.length > 0 ? (
                    personDetails.skills.map((skill, idx) => (
                      skill.name !== '—' ? (
                        <div key={idx}>
                          <div className="flex justify-between text-xs text-[#78716C] font-light mb-1.5">
                            <span>{skill.name}</span>
                            <span>{skill.proficiency}%</span>
                          </div>
                          <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-[#2DD4BF] transition-all duration-500"
                              style={{ width: `${skill.proficiency}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div key={idx} className="text-sm text-[#78716C] font-light">—</div>
                      )
                    ))
                  ) : (
                    <div className="text-sm text-[#78716C] font-light">—</div>
                  )}
                </div>
              </div>
              
              {/* AI Recommendations Section */}
              <div>
                <div className="text-sm font-light text-[#1C1917] font-semibold italic mb-4">AI Recommendations</div>
                <div className="space-y-3">
                  {personDetails.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-white/50 rounded-xl border border-white/20 border-l-2 border-l-[#1C1917]">
                      <div className="text-sm text-[#1C1917] font-light mb-3">{rec.text}</div>
                      <Button size="sm" variant="ghost" className="h-8 text-xs font-light text-[#78716C] hover:text-[#292524]">
                        {rec.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
