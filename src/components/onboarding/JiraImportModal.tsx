import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ParsedMember {
  name: string;
  email: string;
  role: string;
}

interface Props {
  onImport: (members: ParsedMember[]) => void;
  onClose: () => void;
}

export default function JiraImportModal({ onImport, onClose }: Props) {
  const [jiraUrl, setJiraUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ParsedMember[]>([]);

  const handleFetch = async () => {
    if (!jiraUrl.trim() || !apiToken.trim() || !projectKey.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Normalize the Jira URL
      const baseUrl = jiraUrl.replace(/\/+$/, '');
      const url = `${baseUrl}/rest/api/3/project/${projectKey.trim()}/role`;

      const resp = await fetch(url, {
        headers: {
          Authorization: `Basic ${btoa(`${apiToken}`)}`,
          Accept: 'application/json',
        },
      });

      if (!resp.ok) {
        throw new Error(`Jira returned ${resp.status}. Check your URL, project key, and API token.`);
      }

      // Try to fetch project members from actors in roles
      const roles = await resp.json();
      const fetchedMembers: ParsedMember[] = [];

      // Fetch members from each role
      for (const [roleName, roleUrl] of Object.entries(roles)) {
        try {
          const roleResp = await fetch(roleUrl as string, {
            headers: {
              Authorization: `Basic ${btoa(`${apiToken}`)}`,
              Accept: 'application/json',
            },
          });
          if (roleResp.ok) {
            const roleData = await roleResp.json();
            for (const actor of roleData.actors || []) {
              if (actor.actorUser) {
                fetchedMembers.push({
                  name: actor.displayName || actor.name || '',
                  email: actor.actorUser.emailAddress || '',
                  role: roleName || 'Engineer',
                });
              }
            }
          }
        } catch {
          // Skip individual role errors
        }
      }

      if (fetchedMembers.length === 0) {
        setError('No team members found in this project. Make sure the project key is correct and you have access.');
        return;
      }

      // Deduplicate by email
      const seen = new Set<string>();
      const unique = fetchedMembers.filter(m => {
        if (!m.email || seen.has(m.email)) return false;
        seen.add(m.email);
        return true;
      });

      setMembers(unique);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Jira');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (members.length === 0) return;
    onImport(members);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1C1917]">Import from Jira</h2>
          <button onClick={onClose} className="text-[#A8A29E] hover:text-[#1C1917] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-[#78716C] font-light">
            Connect to your Jira instance to import project team members.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#57534E] mb-1 block">Jira Instance URL</label>
              <Input
                placeholder="https://yourteam.atlassian.net"
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#57534E] mb-1 block">API Token (email:token)</label>
              <Input
                placeholder="user@company.com:your-api-token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                type="password"
                className="h-9 text-sm"
              />
              <p className="text-[10px] text-[#A8A29E] mt-1">
                Generate at id.atlassian.com/manage-profile/security/api-tokens
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#57534E] mb-1 block">Project Key</label>
              <Input
                placeholder="e.g. PROJ"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {members.length === 0 ? (
            <Button
              onClick={handleFetch}
              disabled={loading}
              className="w-full h-9 bg-[#0052CC] hover:bg-[#0052CC]/90 text-white font-medium text-sm"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
              ) : (
                'Fetch Team Members'
              )}
            </Button>
          ) : (
            <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-lg p-3">
              <div className="text-xs font-medium text-[#134E4A] mb-2">
                {members.length} member{members.length !== 1 ? 's' : ''} found
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {members.map((m, i) => (
                  <div key={i} className="text-[11px] text-[#57534E] flex gap-3">
                    <span className="font-medium w-28 truncate">{m.name}</span>
                    <span className="text-[#78716C] w-40 truncate">{m.email}</span>
                    <span className="text-[#A8A29E] truncate">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7E5E4] flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="h-9 px-5 border-[#E7E5E4] text-[#57534E] font-normal"
          >
            Cancel
          </Button>
          {members.length > 0 && (
            <Button
              onClick={handleImport}
              className="h-9 px-5 bg-[#1C1917] hover:bg-[#292524] text-white font-normal"
            >
              Import {members.length} Members
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
