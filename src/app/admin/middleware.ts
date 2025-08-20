import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
  last_login?: string
}

export async function verifyAdminAuth(request: NextRequest): Promise<AdminUser | null> {
  try {
    // Check for token in Authorization header
    const authHeader = request.headers.get('authorization')
    let token = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // If no Authorization header, check for token in cookies
    if (!token) {
      token = request.cookies.get('admin_token')?.value
    }

    // If no token found, check localStorage (this would be handled client-side)
    if (!token) {
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Verify user exists and is active
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('status', 'active')
      .single()

    if (error || !admin) {
      return null
    }

    return admin
  } catch (error) {
    console.error('Admin auth verification error:', error)
    return null
  }
}

export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | AdminUser> {
  const admin = await verifyAdminAuth(request)
  
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  return admin
}

export async function requireSuperAdmin(request: NextRequest): Promise<NextResponse | AdminUser> {
  const admin = await verifyAdminAuth(request)
  
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    )
  }

  if (admin.email !== 'ninsawfatawu@gmail.com') {
    return NextResponse.json(
      { error: 'Forbidden - Super admin access required' },
      { status: 403 }
    )
  }

  return admin
}
