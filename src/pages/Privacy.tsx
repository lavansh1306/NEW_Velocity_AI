import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      {/* Nav */}
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
        <h1 className="text-4xl font-light text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: April 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-7 text-slate-600">
          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">1. Information We Collect</h2>
            <p>Velocity AI collects information you provide directly — including your name, email address, and organization details when you create an account. We also collect data about how you use the product, including project data, team member information, and usage patterns.</p>
            <p className="mt-2">When you connect third-party services such as Google Workspace or Jira, we collect the data necessary to provide the integration features, including meeting transcripts, calendar events, and issue data.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve Velocity AI, including:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Processing and analyzing project data to generate AI recommendations</li>
              <li>Sending notifications and product updates</li>
              <li>Improving our AI models and recommendation quality</li>
              <li>Providing customer support</li>
              <li>Ensuring the security and integrity of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase infrastructure with row-level security. OAuth tokens for third-party integrations are encrypted at rest. We use industry-standard security practices including JWT authentication and HTTPS encryption for all data in transit.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with service providers necessary to operate Velocity AI (including Supabase for database hosting, Google Cloud for AI services, and Render for compute infrastructure), and only to the extent necessary to provide the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">5. Third-Party Integrations</h2>
            <p>When you connect Google Workspace or Jira, those services' privacy policies also apply. We request only the minimum permissions necessary and store OAuth credentials securely. You can revoke access at any time from your Settings page.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. To request data deletion or export, contact us at privacy@joinvelocity.co. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use tracking cookies or sell cookie data to advertisers.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-3">8. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:privacy@joinvelocity.co" className="text-indigo-600 hover:underline">privacy@joinvelocity.co</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
