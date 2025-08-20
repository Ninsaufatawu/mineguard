import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const General: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("english");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Interface Preferences</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="text-base font-medium text-gray-700">Dark Mode</Label>
              <p className="text-sm text-gray-500 mt-1">Enable dark mode for the entire application</p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          </div>
          <div>
            <Label htmlFor="language" className="text-base font-medium text-gray-700">Language</Label>
            <p className="text-sm text-gray-500 mt-1">Select your preferred language</p>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="twi">Twi</SelectItem>
                <SelectItem value="hausa">Hausa</SelectItem>
                <SelectItem value="ewe">Ewe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-format" className="text-base font-medium text-gray-700">Date Format</Label>
            <p className="text-sm text-gray-500 mt-1">Choose how dates are displayed</p>
            <Select defaultValue="mdy">
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="time-format" className="text-base font-medium text-gray-700">Time Format</Label>
            <p className="text-sm text-gray-500 mt-1">Choose how time is displayed</p>
            <Select defaultValue="12h">
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Map Settings</h3>
        <div className="space-y-6">
          <div>
            <Label htmlFor="default-map-view" className="text-base font-medium text-gray-700">Default Map View</Label>
            <p className="text-sm text-gray-500 mt-1">Select the default map type</p>
            <Select defaultValue="satellite">
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select map view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="streets">Streets</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="default-location" className="text-base font-medium text-gray-700">Default Location</Label>
            <p className="text-sm text-gray-500 mt-1">Set the default map center location</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="default-lat" className="text-sm text-gray-600">Latitude</Label>
                <Input id="default-lat" defaultValue="5.6037" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="default-long" className="text-sm text-gray-600">Longitude</Label>
                <Input id="default-long" defaultValue="0.1870" className="mt-1" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="default-zoom" className="text-base font-medium text-gray-700">Default Zoom Level</Label>
            <p className="text-sm text-gray-500 mt-1">Set the default map zoom level</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600 mr-3">1</span>
              <Slider
                id="default-zoom"
                defaultValue={[8]}
                min={1}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 ml-3">20</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Country</span>
              <span>Region</span>
              <span>City</span>
              <span>Street</span>
              <span>Building</span>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-refresh" className="text-base font-medium text-gray-700">Auto-Refresh Data</Label>
              <p className="text-sm text-gray-500 mt-1">Automatically refresh data at regular intervals</p>
            </div>
            <Switch id="auto-refresh" defaultChecked />
          </div>
          <div>
            <Label htmlFor="refresh-interval" className="text-base font-medium text-gray-700">Refresh Interval</Label>
            <p className="text-sm text-gray-500 mt-1">How often data should be refreshed</p>
                <Select defaultValue="5">
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="high-performance" className="text-base font-medium text-gray-700">High Performance Mode</Label>
              <p className="text-sm text-gray-500 mt-1">Optimize for performance (uses more resources)</p>
            </div>
            <Switch id="high-performance" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="background-processing" className="text-base font-medium text-gray-700">Background Processing</Label>
              <p className="text-sm text-gray-500 mt-1">Allow processing to continue when app is in background</p>
            </div>
            <Switch id="background-processing" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
};

export default General; 