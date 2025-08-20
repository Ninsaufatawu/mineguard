"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  last_login?: string
}

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode
}

export default function SuperAdminProtectedRoute({ children }: SuperAdminProtectedRouteProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token')
      
      if (!token) {
        router.push('/admin/super-admin/login')
        return
      }

      try {
        const response = await fetch('/admin/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.role === 'super_admin') {
            setUser(data.user)
            setIsAuthorized(true)
          } else {
            // Not a super admin - redirect regular admins to their login
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
            if (data.user && (data.user.role === 'admin' || data.user.role === 'moderator')) {
              router.push('/admin/login')
            } else {
              router.push('/admin/super-admin/login')
            }
          }
        } else {
          // Invalid token
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          router.push('/admin/super-admin/login')
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        router.push('/admin/super-admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleGoToLogin = () => {
    router.push('/admin/login')
  }

  const handleGoToMainAdmin = () => {
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Verifying Super Admin Access</h2>
            <p className="text-sm text-slate-600 text-center">
              Checking your super admin privileges...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4 flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600">
                Only users with <strong>super admin</strong> role can access this dashboard.
              </p>
              <p className="text-xs text-slate-500">
                If you believe this is an error, please contact your system administrator.
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleGoToLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Go to Login
              </Button>
              <Button 
                onClick={handleGoToMainAdmin}
                variant="outline"
                className="w-full"
              >
                Go to Main Admin Dashboard
              </Button>
              <Button onClick={() => router.push('/admin/super-admin/login')} className="w-full">
                Go to Super Admin Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated and has super_admin role
  return <>{children}</>
}
