"use client"

import AdminProtectedRoute from '../components/AdminProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import InviteManager from '../components/InviteManager'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  User, 
  UserPlus, 
  Settings, 
  Lock,
  Activity
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { user, isSuperAdmin } = useAdminAuth()

  return (
    <AdminProtectedRoute>
      <AdminLayout title="Admin Settings">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your admin account and system settings</p>
            </div>
            <Badge className={`${isSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
              <Shield className="w-3 h-3 mr-1" />
              {isSuperAdmin ? 'Super Admin' : 'Administrator'}
            </Badge>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="invites" className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Admin Invites</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="activity" className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your admin account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1">
                        <Badge className={`${isSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Login</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Change Password</h4>
                        <p className="text-sm text-gray-600">Update your account password</p>
                      </div>
                      <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Change Password
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add an extra layer of security</p>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Active Sessions</h4>
                        <p className="text-sm text-gray-600">Manage your active login sessions</p>
                      </div>
                      <button className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        View Sessions
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isSuperAdmin && (
              <TabsContent value="invites" className="space-y-6">
                <InviteManager />
              </TabsContent>
            )}

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your recent admin actions and system activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Logged in to admin panel</p>
                        <p className="text-xs text-gray-500">Today at {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-50">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Accessed dashboard</p>
                        <p className="text-xs text-gray-500">Today at {new Date(Date.now() - 300000).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    
                    {isSuperAdmin && (
                      <div className="flex items-center space-x-3 p-3 border-l-4 border-purple-500 bg-purple-50">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Super admin privileges active</p>
                          <p className="text-xs text-gray-500">Session started</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}
