import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, TrendingUp, Users, DollarSign, Target } from 'lucide-react';

export default function HubSpotTab() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if HubSpot is connected on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/hubspot/auth/status');
      const data = await response.json();
      setIsConnected(data.authenticated);
    } catch (error) {
      console.error('Failed to check HubSpot connection:', error);
    }
  };

  const handleConnect = () => {
    setIsLoading(true);
    window.location.href = '/api/hubspot/auth/connect';
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/hubspot/auth/disconnect');
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect HubSpot:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-gray-900">HubSpot Integration</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            Connect your HubSpot CRM to track deal progress, contact activities, and measure sales productivity gains.
          </p>
        </div>

        {/* Connection Prompt */}
        <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-light text-white">H</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Connect HubSpot</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Link your HubSpot account to unlock CRM analytics, track deal velocity, and measure the impact of AI tools on your sales process.
          </p>
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Connecting...' : 'Connect HubSpot'}
          </Button>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 text-center">
            <Target className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Deal Tracking</h4>
            <p className="text-sm text-gray-600">Monitor deal progression and identify bottlenecks in your sales pipeline.</p>
          </Card>
          <Card className="p-4 sm:p-6 text-center">
            <Users className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Contact Activity</h4>
            <p className="text-sm text-gray-600">Track contact creation, updates, and engagement patterns.</p>
          </Card>
          <Card className="p-4 sm:p-6 text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">ROI Measurement</h4>
            <p className="text-sm text-gray-600">Measure how AI tools accelerate your sales cycle and improve conversion rates.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">HubSpot Dashboard</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
          Real-time insights from your HubSpot CRM data.
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-4 sm:p-6 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">HubSpot Connected</p>
              <p className="text-sm text-green-700">Last sync: 2 minutes ago</p>
            </div>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Disconnect
          </Button>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600">Active Deals</h4>
            <Target className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">47</p>
          <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600">New Contacts</h4>
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">156</p>
          <p className="text-xs text-green-600 mt-2">↑ 8% from last month</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600">Deal Value</h4>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">$2.4M</p>
          <p className="text-xs text-green-600 mt-2">↑ 15% from last month</p>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-600">Conversion Rate</h4>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">24%</p>
          <p className="text-xs text-green-600 mt-2">↑ 5% from last month</p>
        </Card>
      </div>

      {/* Placeholder for charts/data */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Deal Pipeline Analytics</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">HubSpot analytics charts will be displayed here</p>
        </div>
      </Card>
    </div>
  );
}