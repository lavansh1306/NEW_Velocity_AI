import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, TrendingUp, CheckCircle2 } from "lucide-react";

const initiatives = [
  {
    id: 1,
    title: "Q2 Product Launch - Mobile App",
    priority: "high",
    hoursNeeded: 240,
    hoursAllocated: 240,
    team: "Engineering",
    status: "active",
    impact: "High Revenue Impact",
    matches: [
      { name: "Sarah Chen", hours: 80, skills: ["React Native", "iOS"], match: 94 },
      { name: "Mike Rodriguez", hours: 80, skills: ["Backend", "API"], match: 91 },
      { name: "Emily Watson", hours: 80, skills: ["UI/UX", "Testing"], match: 88 },
    ],
  },
  {
    id: 2,
    title: "Customer Portal Redesign",
    priority: "medium",
    hoursNeeded: 160,
    hoursAllocated: 120,
    team: "Product",
    status: "partial",
    impact: "CSAT Improvement",
    matches: [
      { name: "David Kim", hours: 60, skills: ["UI Design", "Figma"], match: 96 },
      { name: "Lisa Park", hours: 60, skills: ["Frontend", "React"], match: 89 },
    ],
  },
  {
    id: 3,
    title: "Analytics Dashboard Enhancement",
    priority: "medium",
    hoursNeeded: 120,
    hoursAllocated: 0,
    team: "Data",
    status: "pending",
    impact: "Internal Efficiency",
    matches: [
      { name: "James Wilson", hours: 60, skills: ["Data Viz", "SQL"], match: 92 },
      { name: "Anna Martinez", hours: 60, skills: ["Python", "Analytics"], match: 87 },
    ],
  },
];

export const RedeploymentView = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Active Initiatives
          </div>
          <div className="text-3xl font-bold">12</div>
          <div className="mt-2 text-xs text-green-600">3 fully allocated</div>
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
          {initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className="rounded-lg border border-border p-6 transition-all hover:shadow-subtle"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h4 className="text-lg font-semibold">{initiative.title}</h4>
                    <Badge
                      variant={
                        initiative.priority === "high"
                          ? "destructive"
                          : initiative.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {initiative.priority.toUpperCase()}
                    </Badge>
                    {initiative.status === "active" && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Team: {initiative.team}</span>
                    <span>•</span>
                    <span>Impact: {initiative.impact}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Allocation Progress</span>
                  <span className="font-medium">
                    {initiative.hoursAllocated}/{initiative.hoursNeeded}h
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-hero transition-all"
                    style={{
                      width: `${(initiative.hoursAllocated / initiative.hoursNeeded) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Recommended Matches:</div>
                {initiative.matches.map((match, idx) => (
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
