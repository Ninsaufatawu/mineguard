import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Helper functions for parsing user agent and getting location
function getBrowserFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  return 'Unknown Browser'
}

function getOSFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Windows NT')) return 'Windows'
  if (userAgent.includes('Mac OS X')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Unknown OS'
}

function getDeviceFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) return 'Mobile'
  if (userAgent.includes('Tablet') || userAgent.includes('iPad')) return 'Tablet'
  return 'Desktop'
}

async function getLocationFromIP(ip: string): Promise<string> {
  // For development/localhost, return a default location
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local Network'
  }
  
  try {
    // Using a free IP geolocation service (you can replace with your preferred service)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`)
    const data = await response.json()
    
    if (data.status === 'success') {
      return `${data.city || 'Unknown'}, ${data.regionName || data.country || 'Unknown'}`
    }
  } catch (error) {
    console.error('Failed to get location from IP:', error)
  }
  
  return 'Unknown Location'
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user exists in admin_users table
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single()

    if (userError || !adminUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get device and location info from request headers
    const userAgent = request.headers.get('user-agent') || ''
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const xRealIp = request.headers.get('x-real-ip')
    const clientIp = xForwardedFor?.split(',')[0] || xRealIp || request.headers.get('cf-connecting-ip') || 'unknown'
    
    // Parse user agent for device info
    const deviceInfo = {
      browser: getBrowserFromUserAgent(userAgent),
      os: getOSFromUserAgent(userAgent),
      device: getDeviceFromUserAgent(userAgent)
    }

    // Generate session ID
    const sessionId = crypto.randomUUID()

    // Update last login and increment login count
    await supabase
      .from('admin_users')
      .update({ 
        last_login: new Date().toISOString(),
        login_count: (adminUser.login_count || 0) + 1
      })
      .eq('id', adminUser.id)

    // First, mark all existing sessions for this user as not current
    await supabase
      .from('admin_login_sessions')
      .update({ is_current: false })
      .eq('admin_user_id', adminUser.id)
      .eq('status', 'active')

    // Create new login session record as current
    const { error: sessionError } = await supabase
      .from('admin_login_sessions')
      .insert({
        id: sessionId,
        admin_user_id: adminUser.id,
        ip_address: clientIp,
        device_info: deviceInfo,
        location: await getLocationFromIP(clientIp),
        is_current: true,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        status: 'active'
      })

    if (sessionError) {
      console.error('Failed to create login session:', sessionError)
      // Don't fail the login if session creation fails, just log it
    }

    // Generate JWT token with session ID
    const token = jwt.sign(
      { 
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.name,
        sessionId: sessionId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        created_at: adminUser.created_at,
        last_login: adminUser.last_login
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
