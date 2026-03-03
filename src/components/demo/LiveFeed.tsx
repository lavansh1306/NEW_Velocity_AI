import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Clock, GitBranch, MessageSquare, FileText } from "lucide-react";

const events = [
  {
    type: "timesaved",
    user: "Sarah Chen",
    tool: "GitHub Copilot",
    hours: 2.4,
    task: "API endpoint implementation",
    icon: GitBranch,
  },
  {
    type: "timesaved",
    user: "Mike Rodriguez",
    tool: "Microsoft Copilot",
    hours: 1.8,
    task: "Document generation",
    icon: FileText,
  },
  {
    type: "redeployment",
    user: "Emily Watson",
    initiative: "Mobile App Launch",
    hours: 40,
    icon: Clock,
  },
  {
    type: "timesaved",
    user: "David Kim",
    tool: "Slack AI",
    hours: 0.9,
    task: "Thread summarization",
    icon: MessageSquare,
  },
  {
    type: "timesaved",
    user: "Lisa Park",
    tool: "Jira Automation",
    hours: 1.2,
    task: "Ticket routing",
    icon: GitBranch,
  },
];

export const LiveFeed = () => {
  const [displayEvents, setDisplayEvents] = useState(events.slice(0, 5));
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setDisplayEvents((prev) => [randomEvent, ...prev.slice(0, 4)]);
      setLastUpdate(Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Activity Feed</h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {displayEvents.map((event, index) => {
          const Icon = event.icon;
          return (
            <div
              key={index}
              className="animate-fade-in rounded-lg border border-border/50 bg-card p-3 text-sm transition-all hover:border-border"
            >
              <div className="mb-2 flex items-start gap-2">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{event.user}</div>
                  {event.type === "timesaved" ? (
                    <>
                      <div className="text-xs text-muted-foreground">
                        Saved <span className="font-semibold text-green-600">{event.hours}h</span> using{" "}
                        {event.tool}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{event.task}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-muted-foreground">
                        Allocated <span className="font-semibold text-blue-600">{event.hours}h</span> to
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{event.initiative}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {event.type === "timesaved" ? "Time Saved" : "Redeployed"}
                </Badge>
                <span className="text-xs text-muted-foreground">{getRelativeTime(lastUpdate)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <button className="text-xs text-primary hover:underline">View all activity →</button>
      </div>
    </Card>
  );
};
