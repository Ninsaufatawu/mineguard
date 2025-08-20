-- Add password reset columns to admin_users table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_reset_token ON admin_users(reset_token);

-- Create table for admin activity logs (if it doesn't exist)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for activity logs
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- Create table for contact requests (optional, for logging contact form submissions)
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    super_admin_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for contact requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- Add comments for documentation
COMMENT ON COLUMN admin_users.reset_token IS 'Secure token for password reset, expires after 1 hour';
COMMENT ON COLUMN admin_users.reset_token_expiry IS 'Expiration timestamp for reset token';
COMMENT ON TABLE admin_activity_logs IS 'Logs admin actions for audit trail';
COMMENT ON TABLE contact_requests IS 'Stores contact form submissions to super admin';
