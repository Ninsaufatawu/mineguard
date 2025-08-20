import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Integrations: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Services</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-satellite text-blue-600"></i>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Sentinel Satellite API</h4>
                <p className="text-xs text-gray-500">Connected on May 15, 2025</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="fas fa-database text-purple-600"></i>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Minerals Commission Database</h4>
                <p className="text-xs text-gray-500">Connected on May 10, 2025</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-leaf text-green-600"></i>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">EPA Database</h4>
                <p className="text-xs text-gray-500">Not connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="!rounded-button cursor-pointer whitespace-nowrap">
              <i className="fas fa-plug mr-2"></i>
              Connect
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <i className="fas fa-map-marked-alt text-yellow-600"></i>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">GIS Data Service</h4>
                <p className="text-xs text-gray-500">Connected on May 20, 2025</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Access</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="api-key" className="text-base font-medium text-gray-700">API Key</Label>
            <p className="text-sm text-gray-500 mt-1">Use this key to access the GhanaMineSight API</p>
            <div className="flex mt-2">
              <Input
                id="api-key"
                type="password"
                value="●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●"
                readOnly
                className="rounded-r-none"
              />
              <Button variant="outline" className="rounded-l-none border-l-0 !rounded-button cursor-pointer whitespace-nowrap">
                <i className="fas fa-eye mr-2"></i>
                Show
              </Button>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" className="!rounded-button cursor-pointer whitespace-nowrap">
              <i className="fas fa-sync-alt mr-2"></i>
              Regenerate Key
            </Button>
            <Button variant="outline" size="sm" className="!rounded-button cursor-pointer whitespace-nowrap">
              <i className="fas fa-book mr-2"></i>
              API Documentation
            </Button>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Webhooks</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook-url" className="text-base font-medium text-gray-700">Webhook URL</Label>
            <p className="text-sm text-gray-500 mt-1">Receive real-time updates at this URL</p>
            <Input id="webhook-url" placeholder="https://your-service.com/webhook" className="mt-2" />
          </div>
          <div>
            <Label className="text-base font-medium text-gray-700">Webhook Events</Label>
            <p className="text-sm text-gray-500 mt-1">Select events to trigger webhooks</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { id: 'webhook-alerts', label: 'New Alerts' },
                { id: 'webhook-reports', label: 'New Reports' },
                { id: 'webhook-licenses', label: 'License Changes' },
                { id: 'webhook-analysis', label: 'Analysis Results' }
              ].map(event => (
                <div key={event.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={event.id}
                    className="h-4 w-4 text-blue-600 rounded"
                    defaultChecked
                  />
                  <label htmlFor={event.id} className="ml-2 text-sm text-gray-700">
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <Button className="!rounded-button cursor-pointer whitespace-nowrap">
            <i className="fas fa-save mr-2"></i>
            Save Webhook
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Integrations; 