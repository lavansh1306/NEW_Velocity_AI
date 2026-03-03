import { Card } from "@/components/ui/card";
import { Database, GitBranch, BarChart3, Shield } from "lucide-react";

const layers = [
  {
    title: "Ingestion Layer",
    description: "Connectors for M365, Jira, HubSpot, Slack, and more",
    icon: GitBranch,
    items: ["OAuth Integration", "Webhook Processing", "Incremental Sync"]
  },
  {
    title: "Processing Layer",
    description: "Normalization, ML inference, and event processing",
    icon: Database,
    items: ["Time-Saved Engine", "Skill Graph Engine", "Canonical Mapping"]
  },
  {
    title: "Intelligence Layer",
    description: "Strategic allocation and impact measurement",
    icon: BarChart3,
    items: ["Redeployment Engine", "ROI Attribution", "Capacity Forecasting"]
  },
  {
    title: "Security & Observability",
    description: "Enterprise-grade monitoring and compliance",
    icon: Shield,
    items: ["RBAC & SSO", "Audit Logging", "SIEM Integration"]
  }
];

export const Architecture = () => {
  return (
    <section className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Production-Ready Architecture
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Built on modern microservices with event-driven processing, multi-tenant isolation, and enterprise security.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {layers.map((layer, index) => (
            <Card key={index} className="bg-card p-6 shadow-subtle transition-all hover:shadow-elevated">
              <div className="mb-4 flex items-start justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <layer.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Layer {index + 1}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">{layer.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{layer.description}</p>
              <ul className="space-y-2">
                {layer.items.map((item, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
