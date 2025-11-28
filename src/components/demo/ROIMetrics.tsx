import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { TrendingUp, DollarSign, Zap, Clock } from "lucide-react";

const impactData = [
  { metric: "Velocity", before: 12.4, after: 16.8, improvement: 35 },
  { metric: "Cycle Time", before: 8.2, after: 5.9, improvement: 28 },
  { metric: "CSAT Score", before: 82, after: 91, improvement: 11 },
  { metric: "Pipeline Value", before: 2.1, after: 2.8, improvement: 33 },
];

const savingsData = [
  { month: "Jan", savings: 42000, investment: 38000 },
  { month: "Feb", savings: 51000, investment: 42000 },
  { month: "Mar", savings: 58000, investment: 45000 },
  { month: "Apr", savings: 62000, investment: 47000 },
  { month: "May", savings: 71000, investment: 49000 },
  { month: "Jun", savings: 79000, investment: 51000 },
];

const attributions = [
  {
    initiative: "Mobile App Launch",
    metric: "Pipeline Value",
    hours: 240,
    impact: "+$680K",
    confidence: 92,
    method: "Diff-in-Diff",
  },
  {
    initiative: "Customer Portal",
    metric: "CSAT Score",
    hours: 160,
    impact: "+9 points",
    confidence: 88,
    method: "Causal Inference",
  },
  {
    initiative: "API Optimization",
    metric: "Cycle Time",
    hours: 120,
    impact: "-2.3 days",
    confidence: 91,
    method: "Regression Analysis",
  },
];

export const ROIMetrics = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total ROI
          </div>
          <div className="text-3xl font-bold text-green-600">3.2x</div>
          <div className="mt-2 text-xs text-muted-foreground">$284K annual savings</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Time to Value
          </div>
          <div className="text-3xl font-bold">4.2mo</div>
          <div className="mt-2 text-xs text-green-600">2.1 months faster</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Attribution Rate
          </div>
          <div className="text-3xl font-bold">89%</div>
          <div className="mt-2 text-xs text-muted-foreground">High confidence</div>
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            Active Projects
          </div>
          <div className="text-3xl font-bold">8</div>
          <div className="mt-2 text-xs text-blue-600">Tracking impact</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Cost Savings vs Investment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={savingsData}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="investment"
                stroke="hsl(var(--secondary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Total Savings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-secondary"></div>
              <span className="text-muted-foreground">AI Investment</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Key Performance Improvements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={impactData} layout="vertical">
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="metric" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="improvement" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-muted-foreground">% improvement after redeployment</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-6 text-lg font-semibold">Causal Attribution Analysis</h3>
        <div className="space-y-4">
          {attributions.map((attr, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="font-semibold">{attr.initiative}</h4>
                  <Badge variant="outline" className="text-xs">
                    {attr.hours}h deployed
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Metric: {attr.metric}</span>
                  <span>•</span>
                  <span>Method: {attr.method}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{attr.impact}</div>
                  <div className="text-xs text-muted-foreground">{attr.confidence}% confidence</div>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-950"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${attr.confidence}%, hsl(var(--muted)) 0)`,
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-xs">
                    {attr.confidence}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
