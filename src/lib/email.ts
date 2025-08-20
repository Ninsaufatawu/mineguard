import sgMail from '@sendgrid/mail'

// SendGrid email notification system
export interface EmailNotification {
  to: string
  subject: string
  message: string
  loginCredentials: {
    email: string
    password: string
    loginUrl: string
  }
  createdBy: string
}

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  try {
    // Always log the notification details
    console.log('📧 EMAIL NOTIFICATION:')
    console.log('To:', notification.to)
    console.log('Subject:', notification.subject)
    console.log('Created by:', notification.createdBy)
    console.log('Login Credentials:')
    console.log('  Email:', notification.loginCredentials.email)
    console.log('  Password:', notification.loginCredentials.password)
    console.log('  Login URL:', notification.loginCredentials.loginUrl)
    console.log('Message:', notification.message)
    console.log('---')
    
    // If SendGrid is configured, send the actual email
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      const emailHtml = generateEmailHTML(notification)
      
      const msg = {
        to: notification.to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: notification.subject,
        text: notification.message,
        html: emailHtml,
      }
      
      await sgMail.send(msg)
      console.log('✅ Email sent successfully via SendGrid to:', notification.to)
      return true
    } else {
      console.log('⚠️ SendGrid not configured - email logged only')
      console.log('💡 To enable email sending:')
      console.log('   SENDGRID_API_KEY=SG.your_sendgrid_api_key_here')
      console.log('   SENDGRID_FROM_EMAIL=noreply@yourdomain.com')
      console.log('   Get your API key at: https://app.sendgrid.com/settings/api_keys')
      return true // Still return true for logging-only mode
    }
    
  } catch (error) {
    console.error('❌ Error sending email notification:', error)
    return false
  }
}

// Generate beautiful HTML email template
function generateEmailHTML(notification: EmailNotification): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GEOGUARD Admin Account Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .credentials { background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ GEOGUARD Admin Account</h1>
          <p>Your administrator account has been created</p>
        </div>
        
        <div class="content">
          <h2>Welcome to GEOGUARD!</h2>
          <p>Hello,</p>
          <p>You have been added as an administrator to the GEOGUARD illegal mining detection system by <strong>${notification.createdBy}</strong>.</p>
          
          <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            <p><strong>Email:</strong> ${notification.loginCredentials.email}</p>
            <p><strong>Password:</strong> <code>${notification.loginCredentials.password}</code></p>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Important Security Note:</strong></p>
            <p>Please change your password immediately after your first login for security purposes.</p>
          </div>
          
          <p>Click the button below to access the admin portal:</p>
          <a href="${notification.loginCredentials.loginUrl}" class="button">Access Admin Portal</a>
          
          <p>Or copy and paste this link: <br><code>${notification.loginCredentials.loginUrl}</code></p>
          
          <h3>🚀 What you can do as an admin:</h3>
          <ul>
            <li>Monitor illegal mining detection reports</li>
            <li>Manage system alerts and notifications</li>
            <li>Access satellite imagery and analysis tools</li>
            <li>Generate compliance reports</li>
            <li>Manage user licenses and permissions</li>
          </ul>
          
          <p>If you have any questions, please contact your system administrator.</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 GEOGUARD. All rights reserved.</p>
          <p>This is an automated message from the GEOGUARD admin system.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function createAdminInviteNotification(
  adminEmail: string,
  loginUrl: string,
  defaultPassword: string,
  createdBy: string
): EmailNotification {
  return {
    to: adminEmail,
    subject: '🛡️ GEOGUARD Admin Account Created',
    message: `You have been added as an administrator to GEOGUARD by ${createdBy}. Please login with the credentials provided and change your password immediately.`,
    loginCredentials: {
      email: adminEmail,
      password: defaultPassword,
      loginUrl: loginUrl
    },
    createdBy: createdBy
  }
}

// Legacy function - keeping for compatibility
export function generateAdminInviteEmail(
  adminEmail: string, 
  inviteLink: string, 
  defaultPassword: string,
  createdBy: string
) {
  return createAdminInviteNotification(adminEmail, inviteLink, defaultPassword, createdBy)
}
