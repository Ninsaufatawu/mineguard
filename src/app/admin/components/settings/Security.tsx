"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from '@supabase/supabase-js';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

interface LoginSession {
  id: string;
  device_info: {
    device?: string;
    browser?: string;
    os?: string;
  };
  location?: string;
  last_activity: string;
  is_current: boolean;
  ip_address?: string;
  user_agent?: string;
}

const Security: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    sessionId?: string;
    sessionInfo?: string;
  }>({ isOpen: false, type: 'single' });
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadAdminData();
    loadSessions();
  }, []);

  const loadAdminData = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) return;

      const tokenPayload = JSON.parse(atob(adminToken.split('.')[1]));
      const userId = tokenPayload.userId;

      const { data, error } = await supabase
        .from('admin_users')
        .select('id, name, email, two_factor_enabled, two_factor_method, password_changed_at')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setAdminUser(data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        console.log('No admin token found');
        return;
      }

      const tokenPayload = JSON.parse(atob(adminToken.split('.')[1]));
      const userId = tokenPayload.userId;
      console.log('Loading sessions for user ID:', userId);

      const response = await fetch(`/admin/api/security/sessions?userId=${userId}`);
      const result = await response.json();
      console.log('Sessions API response:', result);

      if (result.success) {
        console.log('Sessions loaded:', result.sessions);
        setSessions(result.sessions || []);
      } else {
        console.error('Failed to load sessions:', result.error);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
  };

  const handlePasswordChange = async () => {
    if (!adminUser) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 12) {
      setMessage({ type: 'error', text: 'Password must be at least 12 characters long' });
      return;
    }

    try {
      setPasswordLoading(true);
      setMessage(null);

      const response = await fetch('/admin/api/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminUser.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const showLogoutConfirmation = (sessionId: string, sessionInfo: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      sessionId,
      sessionInfo
    });
  };

  const showLogoutAllConfirmation = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'all'
    });
  };

  const handleConfirmedLogoutSession = async (sessionId: string) => {
    try {
      setSessionsLoading(true);
      const response = await fetch('/admin/api/security/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminUser?.id, sessionId })
      });

      const result = await response.json();
      if (result.success) {
        // Remove the session from local state immediately for better UX
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        setMessage({ type: 'success', text: 'Session logged out successfully' });
        // Also reload sessions to ensure data consistency
        setTimeout(() => loadSessions(), 1000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to logout session' });
      }
    } catch (error) {
      console.error('Logout session error:', error);
      setMessage({ type: 'error', text: 'Failed to logout session' });
    } finally {
      setSessionsLoading(false);
      setConfirmDialog({ isOpen: false, type: 'single' });
    }
  };

  const handleConfirmedLogoutAllSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await fetch('/admin/api/security/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminUser?.id, logoutAll: true })
      });

      const result = await response.json();
      if (result.success) {
        await loadSessions();
        setMessage({ type: 'success', text: 'All other sessions logged out successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to logout sessions' });
      }
    } catch (error) {
      console.error('Logout all sessions error:', error);
      setMessage({ type: 'error', text: 'Failed to logout sessions' });
    } finally {
      setSessionsLoading(false);
      setConfirmDialog({ isOpen: false, type: 'all' });
    }
  };

  const getDeviceIcon = (deviceInfo: any) => {
    const device = deviceInfo?.device?.toLowerCase() || '';
    const userAgent = deviceInfo?.user_agent?.toLowerCase() || '';
    
    if (device.includes('iphone') || userAgent.includes('mobile')) {
      return 'fa-mobile-alt';
    }
    return 'fa-laptop';
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading security settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="text-sm text-gray-700">Current Password</Label>
            <div className="relative mt-1">
              <Input 
                id="current-password" 
                type={showPasswords.current ? "text" : "password"}
                className="pr-10" 
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="new-password" className="text-sm text-gray-700">New Password</Label>
            <div className="relative mt-1">
              <Input 
                id="new-password" 
                type={showPasswords.new ? "text" : "password"}
                className="pr-10" 
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-password" className="text-sm text-gray-700">Confirm New Password</Label>
            <div className="relative mt-1">
              <Input 
                id="confirm-password" 
                type={showPasswords.confirm ? "text" : "password"}
                className="pr-10" 
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-700 mb-2">Password Requirements:</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc pl-5">
              <li>At least 12 characters long</li>
              <li>Include at least one uppercase letter</li>
              <li>Include at least one number</li>
              <li>Include at least one special character</li>
              <li>Cannot be the same as previous 5 passwords</li>
            </ul>
          </div>
          <Button 
            className="!rounded-button cursor-pointer whitespace-nowrap"
            onClick={handlePasswordChange}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <i className="fas fa-key mr-2"></i>
            )}
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-gray-700">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
            </div>
            <Switch id="two-factor" defaultChecked />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Method</h4>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-mobile-alt text-blue-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">Authenticator App</p>
                <p className="text-xs text-gray-500">Last verified: May 20, 2025</p>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" className="!rounded-button cursor-pointer whitespace-nowrap">
                <i className="fas fa-sync-alt mr-2"></i>
                Reconfigure
              </Button>
              <Button variant="outline" size="sm" className="!rounded-button cursor-pointer whitespace-nowrap">
                <i className="fas fa-key mr-2"></i>
                Backup Codes
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-base font-medium text-gray-700">Available Methods</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input type="radio" id="method-app" name="2fa-method" className="h-4 w-4 text-blue-600" defaultChecked />
                <label htmlFor="method-app" className="ml-2 text-sm text-gray-700">
                  Authenticator App (Google Authenticator, Authy)
                </label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="method-sms" name="2fa-method" className="h-4 w-4 text-blue-600" />
                <label htmlFor="method-sms" className="ml-2 text-sm text-gray-700">
                  SMS Verification
                </label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="method-email" name="2fa-method" className="h-4 w-4 text-blue-600" />
                <label htmlFor="method-email" className="ml-2 text-sm text-gray-700">
                  Email Verification
                </label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="method-security-key" name="2fa-method" className="h-4 w-4 text-blue-600" />
                <label htmlFor="method-security-key" className="ml-2 text-sm text-gray-700">
                  Security Key (YubiKey, etc.)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Login Sessions</h3>
        <div className="space-y-4">
          
          
          {/* Current Session */}
          {sessions.find(s => s.is_current) && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className={`fas ${getDeviceIcon(sessions.find(s => s.is_current)?.device_info)} text-blue-600`}></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Current Session</p>
                    <p className="text-xs text-gray-500">
                      {sessions.find(s => s.is_current)?.device_info?.browser || 'Browser'} on {sessions.find(s => s.is_current)?.device_info?.os || 'Device'} • {sessions.find(s => s.is_current)?.location || 'Unknown Location'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active Now</Badge>
              </div>
            </div>
          )}
          
          {/* Other Sessions */}
          {sessions.filter(s => !s.is_current).length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-500">No other active sessions found</p>
            </div>
          ) : (
            sessions.filter(s => !s.is_current).map((session) => (
              <div key={session.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <i className={`fas ${getDeviceIcon(session.device_info)} text-gray-600`}></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {session.device_info?.device || 'Unknown Device'} • {session.device_info?.browser || 'Browser'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.location || 'Unknown Location'} • Last active {formatLastActivity(session.last_activity)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 !rounded-button cursor-pointer whitespace-nowrap"
                    onClick={() => showLogoutConfirmation(
                      session.id, 
                      `${session.device_info?.device || 'Unknown Device'} • ${session.device_info?.browser || 'Browser'}`
                    )}
                    disabled={sessionsLoading}
                  >
                    {sessionsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <i className="fas fa-sign-out-alt mr-2"></i>
                    )}
                    Logout
                  </Button>
                </div>
              </div>
            ))
          )}
          
          <Button 
            variant="outline" 
            className="w-full !rounded-button cursor-pointer whitespace-nowrap border-red-600 hover:border-red-600 hover:text-red-600 text-red-500 hover:bg-red-200 bg-red-50"
            onClick={showLogoutAllConfirmation}
            disabled={sessionsLoading || sessions.filter(s => !s.is_current).length === 0}
          >
            {sessionsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <i className="fas fa-sign-out-alt mr-2"></i>
            )}
            Logout of All Other Sessions
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {confirmDialog.type === 'single' ? 'Logout Session' : 'Logout All Other Sessions'}
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                {confirmDialog.type === 'single' 
                  ? `Are you sure you want to logout the session: ${confirmDialog.sessionInfo}? This action cannot be undone.`
                  : `Are you sure you want to logout all other sessions? This will sign out all devices except your current one. This action cannot be undone.`
                }
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ isOpen: false, type: 'single' })}
                disabled={sessionsLoading}
                className="!rounded-button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmDialog.type === 'single' && confirmDialog.sessionId) {
                    handleConfirmedLogoutSession(confirmDialog.sessionId);
                  } else {
                    handleConfirmedLogoutAllSessions();
                  }
                }}
                disabled={sessionsLoading}
                className="!rounded-button bg-red-600 hover:bg-red-700"
              >
                {sessionsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    {confirmDialog.type === 'single' ? 'Logout Session' : 'Logout All Other Sessions'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

export default Security;