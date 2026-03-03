import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const timeData = [
  { month: "Jan", hours: 520, validated: 487 },
  { month: "Feb", hours: 612, validated: 589 },
  { month: "Mar", hours: 695, validated: 668 },
  { month: "Apr", hours: 748, validated: 721 },
  { month: "May", hours: 823, validated: 795 },
  { month: "Jun", hours: 847, validated: 821 },
];

const topTools = [
  { name: "Microsoft Copilot", hours: 284, percentage: 33.5, trend: "up" },
  { name: "GitHub Copilot", hours: 178, percentage: 21.0, trend: "up" },
  { name: "Jira Automation", hours: 142, percentage: 16.8, trend: "stable" },
  { name: "Slack AI", hours: 98, percentage: 11.6, trend: "up" },
  { name: "HubSpot AI", hours: 87, percentage: 10.3, trend: "up" },
  { name: "Other Tools", hours: 58, percentage: 6.8, trend: "stable" },
];

export const TimeTracking = ({ detailed = false }: { detailed?: boolean }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Time Saved Trend</h3>
          <Badge variant="secondary">Last 6 Months</Badge>
        </div>
        <div className="w-full h-48 sm:h-56 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeData}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorValidated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorHours)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="validated"
              stroke="hsl(var(--secondary))"
              fillOpacity={1}
              fill="url(#colorValidated)"
              strokeWidth={2}
            />
          </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Predicted Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary"></div>
            <span className="text-muted-foreground">Validated Hours</span>
          </div>
        </div>
      </Card>

      {detailed && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Top Time-Saving Tools</h3>
          <div className="space-y-4">
            {topTools.map((tool, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{tool.name}</span>
                    {tool.trend === "up" && (
                      <span className="text-xs text-green-600">↑</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{tool.hours}h</span>
                    <Badge variant="outline">{tool.percentage}%</Badge>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-hero transition-all"
                    style={{ width: `${tool.percentage * 3}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
