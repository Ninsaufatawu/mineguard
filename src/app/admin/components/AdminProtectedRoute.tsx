"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { Loader2, Shield } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
}

export default function AdminProtectedRoute({ 
  children, 
  requireSuperAdmin = false 
}: AdminProtectedRouteProps) {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/admin/login')
        return
      }

      // Redirect super admins to their dedicated dashboard
      if (user && user.role === 'super_admin') {
        router.push('/admin/super-admin')
        return
      }

      // Only allow regular admins and moderators
      if (user && user.role !== 'admin' && user.role !== 'moderator') {
        router.push('/admin/login')
        return
      }

      if (requireSuperAdmin && !isSuperAdmin) {
        router.push('/admin/login')
        return
      }
    }
  }, [loading, isAuthenticated, isSuperAdmin, requireSuperAdmin, router, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Verifying admin access...</p>
          <p className="text-purple-200 text-sm">Please wait while we authenticate your session</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-white text-lg font-medium">Access Denied</p>
          <p className="text-red-200 text-sm">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-white text-lg font-medium">Super Admin Access Required</p>
          <p className="text-red-200 text-sm">You don't have permission to access this resource</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
