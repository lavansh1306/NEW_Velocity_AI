import { useState, useEffect } from 'react';

interface Integration {
  id: string;
  name: string;
  connected: boolean;
  icon: string;
  bgColor: string;
  status?: string;
  scope?: string[];
  lastSync?: string;
  events?: string[];
  plannedScope?: string[];
  useCase?: string;
}

interface IntegrationState {
  jira?: boolean;
  hubspot?: boolean;
  asana?: boolean;
  microsoft365?: boolean;
  zapier?: boolean;
}

interface IntegrationsTabProps {
  integrationStates?: IntegrationState;
  onToggleIntegration?: (id: string) => void;
}

export default function IntegrationsTab({ integrationStates, onToggleIntegration }: IntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'hubspot',
      name: 'HubSpot',
      connected: integrationStates?.hubspot ?? true,
      icon: 'H',
      bgColor: 'bg-orange-500',
      status: 'LIVE',
      scope: ['contacts.read', 'deals.read', 'companies.read'],
      lastSync: '2 minutes ago',
      events: ['contact.created', 'deal.closed', 'company.updated']
    },
    {
      id: 'asana',
      name: 'Asana',
      connected: integrationStates?.asana ?? true,
      icon: 'A',
      bgColor: 'bg-pink-500',
      scope: ['tasks.read', 'projects.read'],
      lastSync: '4 minutes ago',
      events: ['task.completed', 'project.updated']
    },
    {
      id: 'jira',
      name: 'Jira',
      connected: integrationStates?.jira ?? true,
      icon: 'J',
      bgColor: 'bg-blue-500',
      status: 'LIVE',
      scope: ['issues.read', 'sprints.read', 'projects.read'],
      lastSync: '3 minutes ago',
      events: ['issue.created', 'issue.updated', 'sprint.completed']
    },
    {
      id: 'microsoft365',
      name: 'Microsoft 365',
      connected: integrationStates?.microsoft365 ?? true,
      icon: 'M',
      bgColor: 'bg-blue-600',
      scope: ['calendar.read', 'mail.read (metadata only)'],
      lastSync: '1 minute ago',
      events: ['meeting.created', 'meeting.duration', 'email.sent']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      connected: integrationStates?.zapier ?? false,
      icon: 'Z',
      bgColor: 'bg-orange-400',
      plannedScope: ['zaps.read', 'zap_runs.read'],
      useCase: 'Track automation executions for capacity calculation'
    }
  ]);

  // Sync integrations with parent state
  useEffect(() => {
    if (integrationStates) {
      setIntegrations(prev => prev.map(int => ({
        ...int,
        connected: integrationStates[int.id as keyof IntegrationState] ?? int.connected
      })));
    }
  }, [integrationStates]);

  const handleToggleConnection = (id: string) => {
    // Update local state
    setIntegrations(prev => prev.map(int => 
      int.id === id ? { ...int, connected: !int.connected } : int
    ));
    
    // Call parent callback if provided
    if (onToggleIntegration) {
      onToggleIntegration(id);
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Secure Data Integrations</h2>
        <p className="text-xs sm:text-sm texut-gray-600 mt-2 leading-relaxed">Read-only OAuth connections • Encrypted secrets • Event-driven ingestion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`bg-white rounded-lg border border-gray-200 p-4 sm:p-6 transition-opacity hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${integration.bgColor} rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {integration.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 text-sm sm:text-base truncate">{integration.name}</div>
                  {integration.connected ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="text-xs text-green-600 font-semibold">Connected</div>
                      {integration.status && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded flex-shrink-0">
                          {integration.status}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 font-semibold">Not Connected</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggleConnection(integration.id)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs font-semibold transition-colors flex-shrink-0 whitespace-nowrap ${
                  integration.connected
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {integration.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-semibold text-gray-700 mb-1">
                  {integration.connected ? 'Scope' : 'Planned Scope'}
                </div>
                <div className="text-gray-600">
                  {(integration.scope || integration.plannedScope || []).join(', ')}
                </div>
              </div>
              {integration.connected && integration.lastSync && (
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 mb-1">Last Sync</div>
                  <div className="text-gray-600">{integration.lastSync}</div>
                </div>
              )}
              {integration.useCase && (
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 mb-1">Use Case</div>
                  <div className="text-gray-600">{integration.useCase}</div>
                </div>
              )}
              {integration.connected && integration.events && integration.events.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Events Tracked</div>
                  <div className="flex flex-wrap gap-2">
                    {integration.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Security Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Security & Compliance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
