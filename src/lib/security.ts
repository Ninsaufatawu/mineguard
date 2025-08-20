import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 reports per 15 minutes per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Request validation patterns
const SUSPICIOUS_PATTERNS = [
  /(<script|javascript:|data:)/i,
  /(union|select|insert|update|delete|drop|create|alter)/i,
  /(eval|exec|system|cmd)/i,
  /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i,
];

/**
 * Generate a secure hash for IP addresses (one-way hashing for privacy)
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex');
}

/**
 * Rate limiting for report submissions
 */
export function checkRateLimit(request: NextRequest): { allowed: boolean; error?: string } {
  try {
    // Get client IP (hashed for privacy)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const hashedIP = hashIP(ip);
    
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean up old entries
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < windowStart) {
        requestCounts.delete(key);
      }
    }
    
    // Check current IP's request count
    const current = requestCounts.get(hashedIP) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (current.count >= MAX_REQUESTS_PER_WINDOW && current.resetTime > now) {
      return {
        allowed: false,
        error: 'Too many report submissions. Please wait 15 minutes before submitting another report.'
      };
    }
    
    // Increment count
    current.count += 1;
    if (current.resetTime <= now) {
      current.resetTime = now + RATE_LIMIT_WINDOW;
      current.count = 1;
    }
    
    requestCounts.set(hashedIP, current);
    return { allowed: true };
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true }; // Fail open for availability
  }
}

/**
 * Validate and sanitize report data for security
 */
export function validateReportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Check for suspicious patterns in text fields
    const textFields = ['incident_description', 'location_description', 'mining_activity_type'];
    
    for (const field of textFields) {
      if (data[field] && typeof data[field] === 'string') {
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(data[field])) {
            errors.push(`Suspicious content detected in ${field}`);
            break;
          }
        }
        
        // Length validation
        if (data[field].length > 5000) {
          errors.push(`${field} exceeds maximum length`);
        }
      }
    }
    
    // Validate report_type - support anonymous and registered reporting
    const validReportTypes = ['anonymous', 'registered'];
    if (!validReportTypes.includes(data.report_type)) {
      errors.push('Invalid report type');
    }
    
    // Validate threat_level
    if (typeof data.threat_level !== 'number' || data.threat_level < 1 || data.threat_level > 5) {
      errors.push('Invalid threat level');
    }
    
    // Validate coordinates
    if (data.location_lat !== undefined) {
      if (typeof data.location_lat !== 'number' || data.location_lat < -90 || data.location_lat > 90) {
        errors.push('Invalid latitude');
      }
    }
    
    if (data.location_lng !== undefined) {
      if (typeof data.location_lng !== 'number' || data.location_lng < -180 || data.location_lng > 180) {
        errors.push('Invalid longitude');
      }
    }
    
    // Validate evidence files array
    if (data.evidence_files && !Array.isArray(data.evidence_files)) {
      errors.push('Invalid evidence files format');
    }
    
    return { valid: errors.length === 0, errors };
    
  } catch (error) {
    console.error('Validation error:', error);
    return { valid: false, errors: ['Validation failed'] };
  }
}

/**
 * Sanitize text input to prevent XSS and injection attacks
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim()
    .substring(0, 5000); // Limit length
}

/**
 * Generate secure report ID
 */
export function generateSecureReportId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `RPT-${timestamp}-${randomBytes}`;
}

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(event: string, details: any = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details: {
      ...details,
      // Remove sensitive data from logs
      ip: details.ip ? hashIP(details.ip) : undefined,
    }
  };
  
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
  
  // In production, send to security monitoring system
  // await sendToSecurityMonitoring(logEntry);
}

/**
 * Check for honeypot field (bot detection)
 */
export function checkHoneypot(data: any): boolean {
  // If honeypot field is filled, it's likely a bot
  return !data.website && !data.phone && !data.email_confirm;
}

/**
 * Validate file uploads for security
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm']
  };
  
  const allowedExtensions = mimeToExt[file.type] || [];
  if (extension && !allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension does not match file type' };
  }
  
  return { valid: true };
}
