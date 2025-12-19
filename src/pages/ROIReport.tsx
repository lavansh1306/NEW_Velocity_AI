import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Line } from "recharts";
import { LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const useCaseMappings: Record<string, string[]> = {
  "Customer Success Ops": ["Customer Success", "FreddyAI", "HubSpot CRM"],
  "GTMs / Product Launch": ["Marketing", "Product", "Custom RAG Stack"],
  "Revenue Pipeline Support": ["RevOps", "Zapier", "HubSpot CRM"],
  "Contractor Cost Reduction": ["Finance", "UIPath", "Blue Prism"],
  "Engineering Backlog Acceleration": ["Engineering", "UIPath"],
  "Strategic Initiatives & Innovation": ["Engineering", "Custom RAG Stack", "FreddyAI"],
};

const initiativeDescriptions: Record<string, string[]> = {
  "Customer Success Ops": [
    "Boosted resolution by triaging AI-freed hours.",
    "Upsell targeting during renewal cycles.",
  ],
  "GTMs / Product Launch": [
    "Deployed hours to close product delivery gaps.",
    "Accelerated campaign content execution and messaging alignment.",
  ],
  "Revenue Pipeline Support": [
    "Repurposed idle time into sales acceleration.",
    "Enhanced pipeline hygiene and forecasting cadence.",
  ],
  "Contractor Cost Reduction": [
    "Substituted internal delivery for outsourcing.",
    "Reallocated budget from external vendors to internal capability uplift.",
  ],
  "Engineering Backlog Acceleration": [
    "Cleared tech debt and advanced retention levers.",
    "Accelerated roadmap commitments through bandwidth unlock.",
  ],
  "Strategic Initiatives & Innovation": [
    "Invested time toward long-term AI and R&D bets.",
    "Explored strategic pilots previously deprioritized.",
  ],
};

const allTools = [
  "FreddyAI",
  "HubSpot CRM",
  "Custom RAG Stack",
  "Zapier",
  "UIPath",
  "Blue Prism",
  "Notion AI",
  "ChatGPT Enterprise",
  "Salesforce Einstein",
  "Workato",
  "DataRobot",
];

const scenarios = {
  conservative: [1, 1.7, 2.5, 3],
  baseline: [1, 2.1, 3.3, 4.8],
  aggressive: [1, 2.8, 4.4, 6.2],
};

const ROIReport = () => {
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [departments, setDepartments] = useState<Set<string>>(new Set());
  const [scenario, setScenario] = useState<"conservative" | "baseline" | "aggressive">("baseline");
  const [roi, setRoi] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedUseCases");
    const cases = stored ? JSON.parse(stored) : [];
    setSelectedUseCases(cases);

    const tools = new Set<string>();
    const depts = new Set<string>();

    cases.forEach((useCase: string) => {
      (useCaseMappings[useCase] || []).forEach((entry) => {
        if (
          ["Customer Success", "Marketing", "Product", "Finance", "Engineering", "RevOps"].includes(
            entry
          )
        ) {
          depts.add(entry);
        } else {
          tools.add(entry);
        }
      });
    });

    setSelectedTools(tools);
    setDepartments(depts);
  }, []);

  useEffect(() => {
    const toolHourValue = 12;
    const baseHours = selectedUseCases.length * 51;
    const extraToolHours = selectedTools.size * toolHourValue;
    const hours = baseHours + extraToolHours;
    const calculatedRoi = hours * 144;

    setTotalHours(hours);
    setRoi(calculatedRoi);
  }, [selectedUseCases, selectedTools]);

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tool)) {
        newSet.delete(tool);
      } else {
        newSet.add(tool);
      }
      return newSet;
    });
  };

  const getChartData = () => {
    const values = scenarios[scenario];
    return [
      { quarter: "Q1", value: Math.round(roi * values[0]) },
      { quarter: "Q2", value: Math.round(roi * values[1]) },
      { quarter: "Q3", value: Math.round(roi * values[2]) },
      { quarter: "Q4", value: Math.round(roi * values[3]) },
    ];
  };

  const getActiveInitiatives = () => {
    const selectedToolNames = Array.from(selectedTools);
    return selectedUseCases
      .filter((useCase) =>
        useCaseMappings[useCase]?.some((item) => selectedToolNames.includes(item))
      )
      .flatMap((useCase) =>
        (initiativeDescriptions[useCase] || []).map((desc) => ({
          useCase,
          description: desc,
        }))
      );
  };

  const chartData = getChartData();
  const q4Value = chartData[3].value;
  const yearlyROI = roi * 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/roi-calculator">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold">Velocity AI</span>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-hero p-8 text-center text-white shadow-2xl md:p-12">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Velocity AI Impact Report</h1>
            <div className="mb-4 text-5xl font-bold text-[#77ff00] md:text-6xl">
            ${yearlyROI.toLocaleString()}
          </div>
          <div className="mb-6 text-xl font-semibold" style={{ color: "#77ff00" }}>
            Forecasted Annual ROI
          </div>
          <p className="mb-2 text-lg">
            <strong>
              <span style={{ color: "#77ff00" }}>${roi.toLocaleString()}</span>
              {' '}
              3-month value unlocked from AI-freed time:
            </strong>{' '}
            {totalHours} hours
          </p>
          <p className="mb-4 text-white/90">
            Your teams are now moving faster, spending smarter, and delivering work that actually drives
            revenue.
          </p>
          <Button size="lg" variant="secondary" className="shadow-lg" onClick={() => { setShowFormModal(true); setFormSubmitted(false); }}>
            Unlock ROI Value-Add Now
          </Button>
        </Card>

        {/* Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="mx-4 w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              {!formSubmitted ? (
                <div>
                  <h3 className="mb-4 text-xl font-semibold">Request a Callback</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Provide your details and we will call you within 24 hours.</p>

                  <div className="space-y-3">
                    <input
                      className="w-full rounded-md border p-2"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <input
                      className="w-full rounded-md border p-2"
                      placeholder="Company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                    <input
                      className="w-full rounded-md border p-2"
                      placeholder="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <input
                      className="w-full rounded-md border p-2"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <textarea
                      className="w-full rounded-md border p-2"
                      placeholder="Optional message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        // simple validation: require name and phone or email
                        if (!formData.name || (!formData.email && !formData.phone)) {
                          alert("Please provide your name and either an email or phone number.");
                          return;
                        }
                        // store data locally (optional)
                        try { localStorage.setItem('roiContact', JSON.stringify(formData)); } catch(e) {}
                        setFormSubmitted(true);
                      }}
                    >
                      Submit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowFormModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
                  <h4 className="mb-2 text-lg font-semibold">Congratulations on Taking Step 1 to Unlocking your ROI</h4>
                  <p className="mb-4 text-sm text-muted-foreground">You'll receive a callback within 24 hours.</p>
                  <div className="flex justify-center">
                    <Button onClick={() => { setShowFormModal(false); }}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Tools and Departments */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-xl font-semibold">
              Tools Used <span className="text-sm font-normal italic text-muted-foreground">(Select AI Tools Used)</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {allTools.map((tool) => (
                <div
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  className={`cursor-pointer rounded-lg border-l-4 p-3 transition-all ${
                    selectedTools.has(tool)
                      ? "border-green-500 bg-green-50"
                      : "border-primary bg-blue-50 hover:bg-blue-100"
                  }`}
                >
                  <span className="font-medium">{tool}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-xl font-semibold">Departments Affected</h3>
            <div className="space-y-3">
              {Array.from(departments).map((dept) => (
                <div
                  key={dept}
                  className="rounded-lg border-l-4 border-primary bg-blue-50 p-3"
                >
                  <span className="font-medium">{dept}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Redeployment Initiatives */}
        <Card className="mb-8 p-6">
          <h2 className="mb-6 text-2xl font-bold">Redeployment Initiatives</h2>
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getActiveInitiatives().map((initiative, index) => (
              <div
                key={index}
                className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4"
              >
                <div className="mb-2 font-semibold text-primary">{initiative.useCase}:</div>
                <div className="text-sm">{initiative.description}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border-l-4 border-green-500 bg-blue-50 p-4 font-semibold text-primary">
            Velocity AI mapped AI-freed hours to revenue-critical initiatives across teams.
          </div>
        </Card>

        {/* Forecast */}
        <Card className="mb-8 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Forecasted Value (12-Month Projection)</h2>
            <div className="flex gap-2">
              {(["conservative", "baseline", "aggressive"] as const).map((s) => (
                <Button
                  key={s}
                  onClick={() => setScenario(s)}
                  variant={scenario === s ? "default" : "outline"}
                  className={scenario === s ? "ring-2 ring-green-500 ring-offset-2" : ""}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="w-full h-56 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 6 }}
              />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-center text-lg font-semibold text-green-600">
            Q4 Forecasted Value Unlock: ${q4Value.toLocaleString()}
          </div>
        </Card>

        {/* Export */}
        <div className="text-center">
          <Button onClick={() => window.print()} size="lg" variant="outline">
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ROIReport;
