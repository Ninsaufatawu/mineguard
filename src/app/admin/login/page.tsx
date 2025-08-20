"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
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
  AtSign, 
  KeyRound, 
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
  Mail,
  Send
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminLoginPage() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Contact form states
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false)
  const [contactEmail, setContactEmail] = useState<string>("")
  const [contactMessage, setContactMessage] = useState<string>("")
  const [isContactLoading, setIsContactLoading] = useState<boolean>(false)
  const [contactSuccess, setContactSuccess] = useState<boolean>(false)
  const [contactError, setContactError] = useState<string | null>(null)
  
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (!email || !password) {
      setError("Please fill all required fields")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/admin/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Check if user is a super admin - redirect them to super admin login
        if (data.user.role === 'super_admin') {
          setError('Super administrators must use the dedicated super admin login.')
          setTimeout(() => {
            router.push('/admin/super-admin/login')
          }, 2000)
          return
        }

        // Only allow regular admins and moderators
        if (data.user.role !== 'admin' && data.user.role !== 'moderator') {
          setError('Access denied. Invalid user role.')
          return
        }

        // Store admin session
        localStorage.setItem('admin_token', data.token)
        localStorage.setItem('admin_user', JSON.stringify(data.user))
        
        // Redirect to regular admin dashboard
        router.push('/admin')
      } else {
        setError(data.message || data.error || "Invalid email or password")
      }
    } catch (error) {
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactError(null)
    setIsContactLoading(true)

    // Validation
    if (!contactEmail || !contactMessage) {
      setContactError("Please fill all required fields")
      setIsContactLoading(false)
      return
    }

    try {
      const response = await fetch('/api/contact-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: contactEmail, 
          message: contactMessage,
          type: 'admin_login_help'
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContactSuccess(true)
        setContactEmail("")
        setContactMessage("")
        setTimeout(() => {
          setIsContactOpen(false)
          setContactSuccess(false)
        }, 3000)
      } else {
        setContactError(data.message || data.error || "Failed to send message")
      }
    } catch (error) {
      setContactError("Failed to send message. Please try again.")
    } finally {
      setIsContactLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <div className="w-full relative p-4">
          <Link href="/" className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </Link>
        </div>

        <CardHeader className="pb-4 flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-center text-slate-600">
            Sign in to GEOGUARD Admin Dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Admin Email</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your admin email"
                  className="pl-10 h-12 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 h-12 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div></div>
              <Link href="/admin/forgot-password" className="text-sm text-purple-600 hover:text-purple-800 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : "Sign In to Admin"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-4">
          <div className="text-center">
            <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
              <DialogTrigger asChild>
                <p className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                  Don't have admin access?{" "}
                  <span className="text-purple-600 font-medium hover:text-purple-700 underline">
                    Contact Super Admin
                  </span>
                </p>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-purple-600" />
                    Contact Super Admin
                  </DialogTitle>
                  <DialogDescription>
                    Need help with admin access? Send a message to the super administrator.
                  </DialogDescription>
                </DialogHeader>
                
                {contactSuccess ? (
                  <div className="py-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Message Sent!</h3>
                    <p className="text-sm text-green-600">
                      Your message has been sent to the super admin. They will contact you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    {contactError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2 text-xs">{contactError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-sm font-medium">
                        Your Email
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="h-10"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-message" className="text-sm font-medium">
                        Message
                      </Label>
                      <Textarea
                        id="contact-message"
                        placeholder="Describe your issue with admin access..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="min-h-[100px] resize-none"
                        required
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsContactOpen(false)}
                        disabled={isContactLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isContactLoading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isContactLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Protected by GEOGUARD Security
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
