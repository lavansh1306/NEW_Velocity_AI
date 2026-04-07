import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white">
            <Zap className="size-4 fill-current" />
          </div>
          <span className="font-bold text-slate-900">Velocity AI</span>
        </Link>
        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-light text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: April 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-7 text-slate-600">
          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Velocity AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">2. Use of the Service</h2>
            <p>You may use Velocity AI for lawful business purposes only. You are responsible for all activity that occurs under your account. You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the Service to violate any law or regulation</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use the Service to process data you don't have rights to</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">3. Your Data</h2>
            <p>You retain ownership of all data you input into Velocity AI. You grant us a limited license to process your data solely to provide the Service. We do not claim ownership of your project data, team information, or organizational data.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">4. AI-Generated Content</h2>
            <p>Velocity AI uses artificial intelligence to generate recommendations, task breakdowns, and team allocations. These are suggestions only. You are solely responsible for any decisions made based on AI output. We make no guarantees about the accuracy or completeness of AI-generated content.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">5. Service Availability</h2>
            <p>We strive for high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the Service at any time with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Velocity AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">7. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email or in-product notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">8. Contact</h2>
            <p>For questions about these terms, contact <a href="mailto:legal@joinvelocity.co" className="text-indigo-600 hover:underline">legal@joinvelocity.co</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
