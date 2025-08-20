"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  UserPlus, 
  Mail, 
  Copy, 
  Check, 
  Clock, 
  UserCheck, 
  UserX,
  RefreshCw,
  AlertCircle,
  Shield
} from "lucide-react"

interface Invite {
  id: string
  email: string
  role: string
  status: string
  token: string
  message?: string
  created_at: string
  used_at?: string
  expires_at: string
  created_by_user?: {
    name: string
    email: string
  }
  used_by_user?: {
    name: string
    email: string
  }
}

export default function InviteManager() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Form state
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("admin")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/admin/api/auth/invite', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setInvites(data.invites)
      } else {
        setError(data.error || 'Failed to fetch invites')
      }
    } catch (error) {
      setError('Failed to fetch invites')
    } finally {
      setLoading(false)
    }
  }

  const createInvite = async () => {
    setError(null)
    setSuccess(null)
    setCreating(true)

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/admin/api/auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role, message })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Invite created successfully! Share this link: ${data.invite.invite_url}`)
        setEmail("")
        setRole("admin")
        setMessage("")
        setShowCreateDialog(false)
        fetchInvites()
      } else {
        setError(data.error || 'Failed to create invite')
      }
    } catch (error) {
      setError('Failed to create invite')
    } finally {
      setCreating(false)
    }
  }

  const copyInviteUrl = async (token: string) => {
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/admin/register?token=${token}`
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'used':
        return <Badge variant="default" className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Used</Badge>
      case 'expired':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><UserX className="w-3 h-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="destructive" className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Super Admin</Badge>
      case 'admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Admin</Badge>
      case 'moderator':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Moderator</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading invites...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Invites</h2>
          <p className="text-gray-600">Manage admin invitations and access</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Invite
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Admin Invite</DialogTitle>
              <DialogDescription>
                Send an invitation to grant admin access to GEOGUARD
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Welcome message for the new admin..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createInvite}
                disabled={creating || !email}
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Create Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invitation History</CardTitle>
          <CardDescription>
            All admin invitations and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invites created yet</p>
              <p className="text-sm text-gray-500">Create your first admin invite to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{invite.email}</h4>
                        {getRoleBadge(invite.role)}
                        {getStatusBadge(invite.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Created: {new Date(invite.created_at).toLocaleString()}</p>
                        <p>Expires: {new Date(invite.expires_at).toLocaleString()}</p>
                        {invite.used_at && (
                          <p>Used: {new Date(invite.used_at).toLocaleString()}</p>
                        )}
                        {invite.message && (
                          <p className="italic">"{invite.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {invite.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteUrl(invite.token)}
                          className="flex items-center space-x-1"
                        >
                          {copiedToken === invite.token ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>{copiedToken === invite.token ? 'Copied!' : 'Copy Link'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
