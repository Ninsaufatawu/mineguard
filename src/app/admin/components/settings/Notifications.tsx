import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const Notifications: React.FC = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
    desktop: true,
    alerts: true,
    reports: true,
    system: false
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-base font-medium text-gray-700">Email Notifications</Label>
              <p className="text-sm text-gray-500 mt-1">Receive notifications via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationSettings.email}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, email: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications" className="text-base font-medium text-gray-700">SMS Notifications</Label>
              <p className="text-sm text-gray-500 mt-1">Receive notifications via SMS</p>
            </div>
            <Switch
              id="sms-notifications"
              checked={notificationSettings.sms}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sms: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications" className="text-base font-medium text-gray-700">Push Notifications</Label>
              <p className="text-sm text-gray-500 mt-1">Receive push notifications on mobile devices</p>
            </div>
            <Switch
              id="push-notifications"
              checked={notificationSettings.push}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, push: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="desktop-notifications" className="text-base font-medium text-gray-700">Desktop Notifications</Label>
              <p className="text-sm text-gray-500 mt-1">Receive notifications in your browser</p>
            </div>
            <Switch
              id="desktop-notifications"
              checked={notificationSettings.desktop}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, desktop: checked})}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="alert-notifications" className="text-base font-medium text-gray-700">System Alerts</Label>
              <p className="text-sm text-gray-500 mt-1">Notifications for new alerts and detections</p>
            </div>
            <Switch
              id="alert-notifications"
              checked={notificationSettings.alerts}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, alerts: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="report-notifications" className="text-base font-medium text-gray-700">Community Reports</Label>
              <p className="text-sm text-gray-500 mt-1">Notifications for new community reports</p>
            </div>
            <Switch
              id="report-notifications"
              checked={notificationSettings.reports}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, reports: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="system-notifications" className="text-base font-medium text-gray-700">System Updates</Label>
              <p className="text-sm text-gray-500 mt-1">Notifications for system maintenance and updates</p>
            </div>
            <Switch
              id="system-notifications"
              checked={notificationSettings.system}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, system: checked})}
            />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notification-frequency" className="text-base font-medium text-gray-700">Notification Frequency</Label>
            <p className="text-sm text-gray-500 mt-1">How often you want to receive notifications</p>
            <Select defaultValue="realtime" className="mt-2">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority-threshold" className="text-base font-medium text-gray-700">Priority Threshold</Label>
            <p className="text-sm text-gray-500 mt-1">Minimum priority level for notifications</p>
            <Select defaultValue="medium" className="mt-2">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All notifications</SelectItem>
                <SelectItem value="low">Low priority and above</SelectItem>
                <SelectItem value="medium">Medium priority and above</SelectItem>
                <SelectItem value="high">High priority only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quiet-hours" className="text-base font-medium text-gray-700">Quiet Hours</Label>
            <p className="text-sm text-gray-500 mt-1">Don't send notifications during these hours</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="quiet-start" className="text-sm text-gray-600">Start Time</Label>
                <Input id="quiet-start" type="time" defaultValue="22:00" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="quiet-end" className="text-sm text-gray-600">End Time</Label>
                <Input id="quiet-end" type="time" defaultValue="07:00" className="mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications; 