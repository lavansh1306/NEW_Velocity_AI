import { useEffect, useState } from 'react';

interface JiraResource {
  id: string;
  name: string;
  url: string;
  scopes: string[];
}

export function useJiraAuth() {
  const [resources, setResources] = useState<JiraResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from cookie
    const jiraToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('jira_access_token='))
      ?.split('=')[1];

    if (!jiraToken) {
      setError('No Jira token found. Please authenticate first.');
      setLoading(false);
      return;
    }

    setToken(jiraToken);

    // Fetch accessible Jira resources
    const fetchResources = async () => {
      try {
        const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
          headers: { 'Authorization': `Bearer ${jiraToken}` }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Jira resources: ${response.statusText}`);
        }

        const data = await response.json();
        setResources(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return { resources, loading, error, token };
}
