import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

const UseCases = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-50 to-slate-100 text-[#0b2c59] font-sans">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-4">How VelocityAI Proves AI Value</h1>
          <p className="text-lg">
            VelocityAI integrates as a <strong>Layer 2</strong> across your existing workflows to convert
            AI-freed time into measurable business results — faster delivery, smarter spend, and
            accelerated innovation.
          </p>
        </header>

        

        <section>
          <h2 className="text-2xl font-semibold text-center mb-6">Layered Value Creation: Core Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">GTM Acceleration</h3>
              <p>Deploy AI-freed time to unblock delivery bottlenecks and pull forward revenue. Especially powerful for cross-functional launches.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Customer Success</h3>
              <p>Reinvest time in triaging and account expansion to drive retention and increase net revenue retention (NRR).</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Pipeline Growth</h3>
              <p>Fuel RevOps and Sales with AI-supported targeting, faster follow-ups, and lower lead-to-close cycle times.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Cost Takeout</h3>
              <p>Replace contractor spend or BPO work by reinvesting internal bandwidth unlocked by automation and copilots.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Tech Backlog Reduction</h3>
              <p>Let engineering redeploy saved time into product acceleration or technical debt resolution for faster roadmap delivery.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Strategic Innovation</h3>
              <p>Reclaim time for experimentation, AI strategy, integrations, or R&D with tangible business case alignment.</p>
            </div>
          </div>

          

          <h2 className="text-2xl font-semibold text-center mt-12 mb-8">Embedded AI in Action</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#fefefe] p-8 rounded-2xl shadow-md border border-slate-200">
              <h3 className="text-xl font-bold mb-2">CS Team + ChatGPT Enterprise</h3>
              <p className="mb-2">Used LLMs for first-draft responses and ticket tagging.</p>
              <p className="text-sm text-gray-600">Repurposed saved hours for upsell targeting in renewals.</p>
            </div>
            <div className="bg-[#fefefe] p-8 rounded-2xl shadow-md border border-slate-200">
              <h3 className="text-xl font-bold mb-2">Product + Custom RAG Stack</h3>
              <p className="mb-2">Surfaced instant historical insights and reduced PRD planning by 30%.</p>
              <p className="text-sm text-gray-600">Increased GTM speed by 2 sprints.</p>
            </div>
            <div className="bg-[#fefefe] p-8 rounded-2xl shadow-md border border-slate-200">
              <h3 className="text-xl font-bold mb-2">RevOps + Notion AI</h3>
              <p className="mb-2">Built a single source of truth, cleaned up CRM, and enabled sales training.</p>
              <p className="text-sm text-gray-600">Directed time toward enablement and ramp.</p>
            </div>
            <div className="bg-[#fefefe] p-8 rounded-2xl shadow-md border border-slate-200">
              <h3 className="text-xl font-bold mb-2">Marketing + Workato</h3>
              <p className="mb-2">Automated lead scoring and campaign launches.</p>
              <p className="text-sm text-gray-600">Shifted time to customer segmentation work.</p>
            </div>
            <div className="bg-[#fefefe] p-8 rounded-2xl shadow-md border border-slate-200">
              <h3 className="text-xl font-bold mb-2">Finance + UIPath</h3>
              <p className="mb-2">Automated vendor onboarding and QA.</p>
              <p className="text-sm text-gray-600">Reclaimed time for FP&A modeling and reviews.</p>
            </div>
            <div className="bg-[#fefefe] p-8 rounded-2xl shadow-md border border-slate-200">
              <h3 className="text-xl font-bold mb-2">Data Science + DataRobot</h3>
              <p className="mb-2">Ran no-code models to validate predictions faster.</p>
              <p className="text-sm text-gray-600">Focused human time on interpretation and rollout.</p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link to="/demo" className="inline-block bg-[#0b2c59] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#09315e] transition-all duration-300">Book a Demo</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UseCases;
