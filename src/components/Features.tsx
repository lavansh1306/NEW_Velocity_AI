import { Card } from "@/components/ui/card";
import { Clock, Target, TrendingUp, Users, Zap, Network } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Time-Saved Engine",
    description: "Automatically track productivity gains from AI tools across M365, Jira, HubSpot, and more with ML-powered validation.",
    color: "text-primary"
  },
  {
    icon: Target,
    title: "Redeployment Engine",
    description: "Match freed capacity to high-impact initiatives using skill graphs and intelligent assignment scoring.",
    color: "text-secondary"
  },
  {
    icon: TrendingUp,
    title: "ROI Attribution",
    description: "Prove business impacts with causal inference, attributing KPI improvements to redeployed hours using diff-in-diff analysis.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Multi-Persona Dashboards",
    description: "Purpose-built views for Managers, CFOs, and CHROs—each showing the metrics that matter most to their role.",
    color: "text-secondary"
  },
  {
    icon: Zap,
    title: "Real-Time Integration",
    description: "Connect to your existing tools with zero manual data entry. Webhooks and incremental syncs keep insights fresh.",
    color: "text-primary"
  },
  {
    icon: Network,
    title: "Enterprise Security",
    description: "SOC 2 compliant architecture with tenant isolation, SSO/RBAC, and comprehensive audit logging.",
    color: "text-secondary"
  }
];

export const Features = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            The Complete Productivity Intelligence Platform
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From traackking AI-generated timesavings to strategic resource allocation and proven ROI measurement.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group bg-gradient-card border-border/50 p-6 shadow-subtle transition-all hover:shadow-elevated"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
