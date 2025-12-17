export default function IntegrationsTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Secure Data Integrations</h2>
        <p className="text-gray-600 mt-1">Read-only OAuth connections • Encrypted secrets • Event-driven ingestion</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* HubSpot */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                H
              </div>
              <div>
                <div className="font-bold text-gray-900">HubSpot</div>
                <div className="text-xs text-green-600 font-semibold">Connected</div>
              </div>
            </div>
            <button className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100">
              Disconnect
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Scope</div>
              <div className="text-gray-600">contacts.read, deals.read, companies.read</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Last Sync</div>
              <div className="text-gray-600">2 minutes ago</div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Events Tracked</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  contact.created
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">deal.stage</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  task.completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Asana */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <div className="font-bold text-gray-900">Asana</div>
                <div className="text-xs text-green-600 font-semibold">Connected</div>
              </div>
            </div>
            <button className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100">
              Disconnect
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Scope</div>
              <div className="text-gray-600">tasks.read, projects.read</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Last Sync</div>
              <div className="text-gray-600">4 minutes ago</div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Events Tracked</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  task.completed
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  task.assigned
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  project.created
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Jira */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                J
              </div>
              <div>
                <div className="font-bold text-gray-900">Jira</div>
                <div className="text-xs text-green-600 font-semibold">Connected</div>
              </div>
            </div>
            <button className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100">
              Disconnect
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Scope</div>
              <div className="text-gray-600">issues.read, sprints.read, projects.read</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Last Sync</div>
              <div className="text-gray-600">3 minutes ago</div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Events Tracked</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  issue.created
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">issue.updated</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  sprint.completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Microsoft 365 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <div>
                <div className="font-bold text-gray-900">Microsoft 365</div>
                <div className="text-xs text-green-600 font-semibold">Connected</div>
              </div>
            </div>
            <button className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100">
              Disconnect
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Scope</div>
              <div className="text-gray-600">calendar.read, mail.read (metadata only)</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Last Sync</div>
              <div className="text-gray-600">1 minute ago</div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Events Tracked</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  meeting.created
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  meeting.duration
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                  email.sent
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Zapier */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center text-white font-bold">
                Z
              </div>
              <div>
                <div className="font-bold text-gray-900">Zapier</div>
                <div className="text-xs text-gray-500 font-semibold">Not Connected</div>
              </div>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700">
              Connect OAuth
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Planned Scope</div>
              <div className="text-gray-600">zaps.read, zap_runs.read</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-700 mb-1">Use Case</div>
              <div className="text-gray-600">Track automation executions for capacity calculation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Security & Compliance</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-blue-900">Authentication</div>
            <div className="text-blue-700">SSO/SCIM via WorkOS</div>
          </div>
          <div>
            <div className="font-semibold text-blue-900">API Key Storage</div>
            <div className="text-blue-700">Encrypted in Supabase Vault</div>
          </div>
          <div>
            <div className="font-semibold text-blue-900">Connection Scope</div>
            <div className="text-blue-700">Read-Only OAuth Only</div>
          </div>
        </div>
      </div>
    </div>
  );
}
