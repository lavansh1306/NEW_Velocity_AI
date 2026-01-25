import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Users, TrendingUp, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  hoursNeeded: number;
  hoursAllocated: number;
  team: string;
  status: "active" | "partial" | "pending";
  impact: string;
  requiredSkills: string[];
  matches: Array<{
    name: string;
    hours: number;
    skills: string[];
    match: number;
  }>;
}

interface AssignmentResult {
  taskId: string;
  assignedEmployeeId: string;
  score: number;
  skillMatchConfidence: number;
}

const mockEmployees = [
  { id: "emp1", name: "Sarah Chen" },
  { id: "emp2", name: "Mike Rodriguez" },
  { id: "emp3", name: "Emily Watson" },
  { id: "emp4", name: "David Kim" },
  { id: "emp5", name: "Lisa Park" },
  { id: "emp6", name: "James Wilson" },
  { id: "emp7", name: "Anna Martinez" },
];

const getEmployeeName = (employeeId: string): string => {
  const employee = mockEmployees.find(emp => emp.id === employeeId);
  return employee ? employee.name : "Unknown Employee";
};

const initialTasks: Task[] = [
  {
    id: "task1",
    title: "Q2 Product Launch - Mobile App",
    priority: "high",
    hoursNeeded: 240,
    hoursAllocated: 240,
    team: "Engineering",
    status: "active",
    impact: "High Revenue Impact",
    requiredSkills: ["React Native", "iOS"],
    matches: [
      { name: "Sarah Chen", hours: 80, skills: ["React Native", "iOS"], match: 94 },
      { name: "Mike Rodriguez", hours: 80, skills: ["Backend", "API"], match: 91 },
      { name: "Emily Watson", hours: 80, skills: ["UI/UX", "Testing"], match: 88 },
    ],
  },
  {
    id: "task2",
    title: "Customer Portal Redesign",
    priority: "medium",
    hoursNeeded: 160,
    hoursAllocated: 120,
    team: "Product",
    status: "partial",
    impact: "CSAT Improvement",
    requiredSkills: ["UI Design", "Figma"],
    matches: [
      { name: "David Kim", hours: 60, skills: ["UI Design", "Figma"], match: 96 },
      { name: "Lisa Park", hours: 60, skills: ["Frontend", "React"], match: 89 },
    ],
  },
  {
    id: "task3",
    title: "Analytics Dashboard Enhancement",
    priority: "medium",
    hoursNeeded: 120,
    hoursAllocated: 0,
    team: "Data",
    status: "pending",
    impact: "Internal Efficiency",
    requiredSkills: ["Data Viz", "SQL"],
    matches: [
      { name: "James Wilson", hours: 60, skills: ["Data Viz", "SQL"], match: 92 },
      { name: "Anna Martinez", hours: 60, skills: ["Python", "Analytics"], match: 87 },
    ],
  },
];

export const RedeploymentView = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});
  const [assignmentResults, setAssignmentResults] = useState<Record<string, AssignmentResult>>({});
  const { toast } = useToast();

  const handleAddSkillAndReassign = async (taskId: string) => {
    const newSkill = newSkillInputs[taskId]?.trim();
    if (!newSkill) {
      toast({
        title: "Error",
        description: "Please enter a skill to add",
        variant: "destructive",
      });
      return;
    }

    setLoadingTasks(prev => ({ ...prev, [taskId]: true }));

    try {
      const response = await fetch('/api/deployed/add-skill-and-reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          newSkill,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reassign task');
      }

      const result: AssignmentResult = await response.json();

      // Update task with new skill
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, requiredSkills: [...task.requiredSkills, newSkill] }
          : task
      ));

      // Store assignment result
      setAssignmentResults(prev => ({ ...prev, [taskId]: result }));

      // Clear input
      setNewSkillInputs(prev => ({ ...prev, [taskId]: '' }));

      toast({
        title: "Success",
        description: `Task reassigned successfully!`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to reassign task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employeeMap: Record<string, string> = {
      'emp1': 'Sarah Chen',
      'emp2': 'Mike Rodriguez',
      'emp3': 'Emily Watson'
    };
    return employeeMap[employeeId] || employeeId;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Active Initiatives
          </div>
          <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'active').length}</div>
          <div className="mt-2 text-xs text-green-600">{tasks.filter(t => t.hoursAllocated >= t.hoursNeeded).length} fully allocated</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Available Capacity
          </div>
          <div className="text-3xl font-bold">427h</div>
          <div className="mt-2 text-xs text-blue-600">Across 23 team members</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Match Success Rate
          </div>
          <div className="text-3xl font-bold">94%</div>
          <div className="mt-2 text-xs text-green-600">↑ 12% this quarter</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-6 text-lg font-semibold">Strategic Initiatives & Recommendations</h3>
        <div className="space-y-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-border p-6 transition-all hover:shadow-subtle"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h4 className="text-lg font-semibold">{task.title}</h4>
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {task.priority.toUpperCase()}
                    </Badge>
                    {task.status === "active" && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Team: {task.team}</span>
                    <span>•</span>
                    <span>Impact: {task.impact}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Required Skills: </span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {task.requiredSkills.map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Allocation Progress</span>
                  <span className="font-medium">
                    {task.hoursAllocated}/{task.hoursNeeded}h
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-hero transition-all"
                    style={{
                      width: `${(task.hoursAllocated / task.hoursNeeded) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Assignment Result */}
              {assignmentResults[task.id] && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">
                    ✓ Assigned to: {getEmployeeName(assignmentResults[task.id].assignedEmployeeId)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Score: {assignmentResults[task.id].score.toFixed(2)} |
                    Skill match confidence: {(assignmentResults[task.id].skillMatchConfidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {/* Add Skill Section */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Add required skill (e.g., 'Kubernetes', 'AWS')"
                    value={newSkillInputs[task.id] || ''}
                    onChange={(e) => setNewSkillInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkillAndReassign(task.id);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleAddSkillAndReassign(task.id)}
                    disabled={loadingTasks[task.id]}
                    size="sm"
                    className="gap-1"
                  >
                    {loadingTasks[task.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Recalculate & Assign
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Recommended Matches:</div>
                {task.matches.map((match, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-white">
                        {match.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-medium">{match.name}</div>
                        <div className="flex gap-1 text-xs text-muted-foreground">
                          {match.skills.map((skill, i) => (
                            <span key={i}>
                              {skill}
                              {i < match.skills.length - 1 && " •"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{match.hours}h available</div>
                        <div className="text-xs text-green-600">{match.match}% match</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
