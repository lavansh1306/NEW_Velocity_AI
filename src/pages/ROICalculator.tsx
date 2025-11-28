import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const useCases = [
  {
    title: "Customer Success Ops",
    description: "Boost resolution rates by shifting AI-saved hours to triage and deep-dive support. Quantify deflection + upsell gains.",
  },
  {
    title: "GTMs / Product Launch",
    description: "Accelerate time-to-market. Measure revenue pull-forward by applying freed time to unblock GTM delivery gaps.",
  },
  {
    title: "Revenue Pipeline Support",
    description: "Deploy idle time toward sales prep, lead targeting, and follow-through. Show value through higher pipeline velocity.",
  },
  {
    title: "Contractor Cost Reduction",
    description: "Reduce external spend by using internal time saved from AI for delivery work. We'll help quantify exact cost offsets.",
  },
  {
    title: "Engineering Backlog Acceleration",
    description: "Use saved time to attack tech debt or fast-track high-priority product fixes that drive retention.",
  },
  {
    title: "Strategic Initiatives & Innovation",
    description: "Fuel innovation by applying time toward long-range initiatives like R&D, integrations, or AI strategy execution.",
  },
];

const ROICalculator = () => {
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const toggleSelect = (title: string) => {
    setSelectedCases((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const calculateROI = () => {
    if (selectedCases.length === 0) {
      alert("Please select at least one area to calculate ROI.");
      return;
    }
    setShowModal(true);
  };

  const handleContinue = () => {
    localStorage.setItem("selectedUseCases", JSON.stringify(selectedCases));
    navigate("/roi-report");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <span className="text-xl font-bold">Velocity AI</span>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-primary md:text-5xl">ROI Calculator</h1>
          <p className="mb-12 text-lg text-muted-foreground md:text-xl">
            Select where you'd like to redeploy AI-freed time. We'll calculate the real-world value based on your inputs.
          </p>

          <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <Card
                key={useCase.title}
                onClick={() => toggleSelect(useCase.title)}
                className={`group cursor-pointer p-6 transition-all hover:shadow-lg ${
                  selectedCases.includes(useCase.title)
                    ? "border-2 border-primary bg-primary/5 shadow-md"
                    : "border-2 border-transparent"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="min-h-[48px] text-left text-lg font-semibold text-primary">
                    {useCase.title}
                  </h3>
                  {selectedCases.includes(useCase.title) && (
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary" />
                  )}
                </div>
                <p className="text-left text-sm text-muted-foreground">{useCase.description}</p>
              </Card>
            ))}
          </div>

          <Button size="lg" onClick={calculateROI} className="px-8 py-6 text-lg">
            Calculate My ROI
          </Button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <Card
            className="mx-4 max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-semibold text-primary">
              You're exploring ROI for:
            </h2>
            <ul className="mb-6 space-y-2 text-left">
              {selectedCases.map((caseTitle) => (
                <li key={caseTitle} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{caseTitle}</span>
                </li>
              ))}
            </ul>
            <Button onClick={handleContinue} className="w-full" size="lg">
              View My ROI Report
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ROICalculator;
