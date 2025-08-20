"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  last_login?: string
}

interface AdminAuthState {
  user: AdminUser | null
  loading: boolean
  isAuthenticated: boolean
  isSuperAdmin: boolean
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    isSuperAdmin: false
  })
  
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const userStr = localStorage.getItem('admin_user')

      if (!token || !userStr) {
        setState({
          user: null,
          loading: false,
          isAuthenticated: false,
          isSuperAdmin: false
        })
        return
      }

      const user = JSON.parse(userStr) as AdminUser

      // Verify token is still valid by making a test API call
      const response = await fetch('/admin/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setState({
          user,
          loading: false,
          isAuthenticated: true,
          isSuperAdmin: user.email === 'ninsawfatawu@gmail.com'
        })
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        setState({
          user: null,
          loading: false,
          isAuthenticated: false,
          isSuperAdmin: false
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
        isSuperAdmin: false
      })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/admin/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('admin_token', data.token)
        localStorage.setItem('admin_user', JSON.stringify(data.user))
        
        setState({
          user: data.user,
          loading: false,
          isAuthenticated: true,
          isSuperAdmin: data.user.email === 'ninsawfatawu@gmail.com'
        })
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setState({
      user: null,
      loading: false,
      isAuthenticated: false,
      isSuperAdmin: false
    })
    router.push('/admin/login')
  }, [router])

  const requireAuth = useCallback(() => {
    if (!state.loading && !state.isAuthenticated) {
      router.push('/admin/login')
    }
  }, [state.loading, state.isAuthenticated, router])

  const requireSuperAdmin = useCallback(() => {
    if (!state.loading && (!state.isAuthenticated || !state.isSuperAdmin)) {
      router.push('/admin/login')
    }
  }, [state.loading, state.isAuthenticated, state.isSuperAdmin, router])

  return {
    ...state,
    login,
    logout,
    requireAuth,
    requireSuperAdmin,
    checkAuth
  }
}
