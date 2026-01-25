import { useJiraAuth } from '@/hooks/useJiraAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function JiraDashboard() {
  const { resources, loading, error, token } = useJiraAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600">Loading your Jira resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.href = '/api/jira/auth/connect'}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Jira Dashboard</h1>
          <p className="text-gray-600 mt-2">Connected resources</p>
        </div>

        {resources.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500">No Jira resources found. Make sure your OAuth app has access.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="text-lg">{resource.name}</span>
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">URL</p>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {resource.url}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {resource.scopes.map(scope => (
                          <span 
                            key={scope}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>Token stored: {token ? '✓ Secure' : '✗ Missing'}</p>
        </div>
      </div>
    </div>
  );
}
