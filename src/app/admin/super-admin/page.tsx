"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, UserPlus, LogOut, Copy, CheckCircle, AlertCircle, Users, Mail, Settings, Activity } from 'lucide-react'
import SuperAdminProtectedRoute from '../components/SuperAdminProtectedRoute'
import InviteManager from '../components/InviteManager'

interface Invite {
  id: string
  email: string
  token: string
  status: 'pending' | 'used' | 'expired'
  created_at: string
  expires_at: string
  created_by_name: string
}

export default function SuperAdminPage() {
  const [email, setEmail] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('Admin123!')
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('admin_user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    loadInvites()
  }, [])

  const loadInvites = async () => {
    try {
      const response = await fetch('/admin/api/auth/invite')
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites || [])
      }
    } catch (error) {
      console.error('Error loading invites:', error)
    }
  }

  const createAdminDirectly = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    if (!defaultPassword.trim()) {
      setMessage({ type: 'error', text: 'Please enter a default password' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/admin/api/auth/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ 
          email: email.trim(),
          password: defaultPassword,
          name: email.split('@')[0] // Use email prefix as default name
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        const successMessage = data.email_sent 
          ? `✅ Admin created successfully! Invitation email sent to ${email}` 
          : `⚠️ Admin created but email failed to send. Login: ${email}, Password: ${defaultPassword}`
        
        setMessage({ 
          type: 'success', 
          text: successMessage
        })
        setEmail('')
        loadInvites()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create admin' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  const handleGoToMainAdmin = () => {
    router.push('/admin')
  }

  return (
    <SuperAdminProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Portal</h1>
                <p className="text-gray-600">Create new administrators</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Super Admin'}</p>
                <Badge variant="default" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              </div>
              <Button onClick={handleGoToMainAdmin} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Main Admin
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Create Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Create New Administrator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter admin email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Password (they can change later)
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter default password"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={createAdminDirectly} disabled={loading} className="w-full">
                {loading ? 'Creating Admin...' : 'Create Administrator'}
              </Button>
              
              
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => router.push('/admin')} 
                variant="outline" 
                className="w-full justify-start"
              >
                📊 Go to Main Admin Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/admin/settings')} 
                variant="outline" 
                className="w-full justify-start"
              >
                ⚙️ Admin Settings
              </Button>
            </CardContent>
          </Card>

          {/* Admin Invite Management */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <InviteManager />
          </div>

          

         
        </div>
      </div>
    </SuperAdminProtectedRoute>
  )
}
