import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, Lock, Shield, Eye, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Integration {
  name: string;
  status: 'active' | 'pending' | 'disabled';
  scope: string[];
  accessLevel: 'read-only' | 'read-write';
  lastVerified: string;
  approvedBy?: string;
  approvedDate?: string;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'access' | 'change' | 'incident' | 'warning';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: string;
}

export default function SecurityAuditTab() {
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);

  const integrations: Record<string, Integration> = {
    hubspot: {
      name: 'HubSpot',
      status: 'active',
      scope: ['contacts.read', 'deals.read', 'companies.read'],
      accessLevel: 'read-only',
      lastVerified: '2025-12-01',
      approvedBy: 'John Smith',
      approvedDate: '2025-11-01',
    },
    jira: {
      name: 'Jira',
      status: 'active',
      scope: ['issues.read', 'sprints.read', 'projects.read'],
      accessLevel: 'read-only',
      lastVerified: '2025-12-01',
      approvedBy: 'John Smith',
      approvedDate: '2025-11-01',
    },
    asana: {
      name: 'Asana',
      status: 'active',
      scope: ['tasks.read', 'projects.read'],
      accessLevel: 'read-only',
      lastVerified: '2025-12-01',
      approvedBy: 'John Smith',
      approvedDate: '2025-11-01',
    },
    microsoft365: {
      name: 'Microsoft 365',
      status: 'active',
      scope: ['calendar.read', 'mail.read (metadata only)'],
      accessLevel: 'read-only',
      lastVerified: '2025-12-01',
      approvedBy: 'John Smith',
      approvedDate: '2025-11-01',
    },
    zapier: {
      name: 'Zapier',
      status: 'pending',
      scope: ['zaps.read', 'zap_runs.read'],
      accessLevel: 'read-only',
      lastVerified: '2025-12-15',
    },
  };

  const securityEvents: SecurityEvent[] = [
    {
      id: '1',
      type: 'login',
      description: 'Successful login from 192.168.1.100',
      timestamp: '2 hours ago',
      severity: 'low',
      user: 'you@example.com',
    },
    {
      id: '2',
      type: 'access',
      description: 'HubSpot data export - 2,450 records',
      timestamp: '4 hours ago',
      severity: 'low',
      user: 'you@example.com',
    },
    {
      id: '3',
      type: 'change',
      description: 'API key rotation completed',
      timestamp: '1 day ago',
      severity: 'low',
      user: 'system',
    },
    {
      id: '4',
      type: 'warning',
      description: 'Failed login attempt detected',
      timestamp: '2 days ago',
      severity: 'medium',
      user: 'unknown',
    },
  ];

  const complianceStatus = {
    gdpr: true,
    hipaa: false,
    soc2: true,
    iso27001: true,
    dpa: true,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Security Audit</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
          Comprehensive security compliance and integration verification dashboard
        </p>
      </div>

      {/* Security Score Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 text-white rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold">
              A+
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Security Score</h3>
              <p className="text-xs sm:text-sm text-gray-600">All systems operational</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-600">Last Audit</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">Dec 18, 2025</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 bg-gray-100 p-1 rounded-lg h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm py-2">Integrations</TabsTrigger>
          <TabsTrigger value="access" className="text-xs sm:text-sm py-2">Access</TabsTrigger>
          <TabsTrigger value="data" className="text-xs sm:text-sm py-2">Data</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm py-2">Compliance</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm py-2">Audit Log</TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs sm:text-sm py-2">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-600">Active Integrations</h4>
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">4</p>
              <p className="text-xs text-gray-500 mt-2">All verified</p>
            </Card>

            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-600">API Keys</h4>
                <Key className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-500 mt-2">Last rotated 90 days ago</p>
            </Card>

            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-600">Encryption</h4>
                <Lock className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">TLS 1.3</p>
              <p className="text-xs text-gray-500 mt-2">In-transit & at-rest</p>
            </Card>

            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-600">Incidents</h4>
                <Eye className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Security Status</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">SSL/TLS Encryption</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">Database Encryption</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">DDoS Protection</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">2FA Enforcement</span>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Access Control</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">Active Users</span>
                  <span className="text-sm sm:text-base font-bold text-gray-900">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">Active Sessions</span>
                  <span className="text-sm sm:text-base font-bold text-gray-900">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">Role-Based Access</span>
                  <span className="text-sm sm:text-base font-bold text-green-600">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">Password Policy</span>
                  <span className="text-sm sm:text-base font-bold text-green-600">Strong</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          {Object.entries(integrations).map(([key, integration]) => (
            <Card key={key} className="p-4 sm:p-6">
              <button
                onClick={() => setExpandedIntegration(expandedIntegration === key ? null : key)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {getStatusIcon(integration.status)}
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900">{integration.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {integration.status === 'active' ? '✓ Connected' : integration.status === 'pending' ? '⏳ Pending Approval' : '✗ Disabled'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full ${integration.accessLevel === 'read-only' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {integration.accessLevel === 'read-only' ? '🔒 Read-only' : '✏️ Read-Write'}
                    </span>
                  </div>
                </div>
              </button>

              {expandedIntegration === key && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">API Scopes</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.scope.map((scope, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-600">Last Verified</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">{integration.lastVerified}</p>
                    </div>
                    {integration.approvedBy && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600">Approved By</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">{integration.approvedBy}</p>
                      </div>
                    )}
                  </div>
                  {integration.status === 'pending' && (
                    <div className="mt-4">
                      <Button className="w-full text-xs sm:text-sm">Request Approval</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">User Accounts</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">you@example.com</p>
                  <p className="text-xs text-gray-600">Admin Role</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Active</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Active Sessions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Chrome on Windows</p>
                  <p className="text-xs text-gray-600">192.168.1.100 • Now</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">Current</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">API Keys</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">pk_live_***4nd9</p>
                  <p className="text-xs text-gray-600">Created 90 days ago</p>
                </div>
                <button className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold whitespace-nowrap">Rotate</button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Data Security Tab */}
        <TabsContent value="data" className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Data Storage</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Primary Region</p>
                  <p className="text-xs text-gray-600">US-East (N. Virginia)</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Backup Region</p>
                  <p className="text-xs text-gray-600">US-West (N. California)</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Encryption</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">In-Transit (TLS 1.3)</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">At-Rest (AES-256)</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">Database Encryption</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Data Retention</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Audit Logs</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">7 years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Backup Retention</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">30 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Disaster Recovery RTO</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">1 hour</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Certifications & Standards</h3>
            <div className="space-y-3">
              {Object.entries(complianceStatus).map(([standard, status]) => (
                <div key={standard} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 uppercase">{standard}</span>
                  {status ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Data Protection</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">GDPR Compliant</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">Data Processing Agreement</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <span className="text-xs sm:text-sm font-semibold text-gray-900">HIPAA Compliance</span>
                <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-700">N/A</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Compliance Checklist</h3>
            <div className="space-y-3">
              {['Privacy Policy Updated', 'Terms of Service Current', 'Security Training Completed', 'Incident Response Plan', 'Regular Audits Scheduled'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-900">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          {securityEvents.map((event) => (
            <Card key={event.id} className={`p-4 sm:p-6 ${getSeverityColor(event.severity)}`}>
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold capitalize mb-1">{event.type}</h4>
                  <p className="text-xs sm:text-sm font-semibold break-words">{event.description}</p>
                  <p className="text-xs mt-2 opacity-75">{event.timestamp}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-white bg-opacity-50 whitespace-nowrap flex-shrink-0 capitalize">
                  {event.severity}
                </span>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6 border-l-4 border-green-500 bg-green-50">
            <div className="flex items-start gap-3 sm:gap-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Action Complete</h4>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">API keys rotated within 90-day policy</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border-l-4 border-yellow-500 bg-yellow-50">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Recommended: Enable 2FA</h4>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">Enhance account security with two-factor authentication</p>
                <button className="mt-3 text-xs sm:text-sm font-bold text-yellow-700 hover:text-yellow-800">Enable Now →</button>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border-l-4 border-blue-500 bg-blue-50">
            <div className="flex items-start gap-3 sm:gap-4">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Upcoming: Zapier Integration Review</h4>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">Pending IT approval for read-only access to Zapier zaps and run history</p>
                <button className="mt-3 text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800">View Details →</button>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Security Best Practices</h3>
            <ul className="space-y-3">
              {[
                'Rotate API keys every 90 days',
                'Review access logs monthly',
                'Update integrations when available',
                'Enable 2FA for all accounts',
                'Schedule quarterly security audits',
                'Document security policies',
              ].map((practice, idx) => (
                <li key={idx} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-700">{practice}</span>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-xs sm:text-sm text-gray-600 text-center">
          Questions about security? <a href="mailto:security@example.com" className="text-blue-600 hover:text-blue-700 font-semibold">Contact IT Security</a> • <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">Report an Incident</a>
        </p>
      </div>
    </div>
  );
}
