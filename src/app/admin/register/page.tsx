"use client"

import { useState, useEffect, Suspense } from "react"

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'
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
import { 
  AtSign, 
  KeyRound, 
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
  User,
  CheckCircle
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function AdminRegisterForm() {
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  // Validate invite token on page load
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invite token")
      setTokenValid(false)
      return
    }
    
    validateToken()
  }, [token])
  
  const validateToken = async () => {
    try {
      const response = await fetch(`/admin/api/auth/validate-invite?token=${token}`)
      const data = await response.json()
      
      if (response.ok) {
        setTokenValid(true)
        setInviteData(data.invite)
        setEmail(data.invite.email) // Pre-fill email from invite
      } else {
        setError(data.error || "Invalid or expired invite token")
        setTokenValid(false)
      }
    } catch (error) {
      setError("Failed to validate invite token")
      setTokenValid(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all required fields")
      setIsLoading(false)
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/admin/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          token 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Admin account created successfully! You can now sign in.")
        setTimeout(() => {
          router.push('/admin/login')
        }, 2000)
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-slate-600">Validating invite token...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">Invalid Invite</CardTitle>
            <CardDescription className="text-slate-600">
              This invite link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-500 mb-4">
              Please contact the super admin for a new invite link.
            </p>
            <Link href="/admin/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <div className="w-full relative p-4">
          <Link href="/admin/login" className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </Link>
        </div>

        <CardHeader className="pb-4 flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Create Admin Account
          </CardTitle>
          <CardDescription className="text-center text-slate-600">
            Complete your admin registration
          </CardDescription>
          {inviteData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-green-700">
                <strong>Invited by:</strong> Super Admin<br />
                <strong>Role:</strong> {inviteData.role || 'Administrator'}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-xs">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 py-2 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="ml-2 text-xs text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10 h-12 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 h-12 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={true} // Email is pre-filled from invite
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Email is pre-filled from your invite</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="pl-10 h-12 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10 h-12 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-600">
                <strong>Password Requirements:</strong><br />
                • At least 8 characters long<br />
                • Use a combination of letters, numbers, and symbols
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-md shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : "Create Admin Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-slate-600">Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminRegisterForm />
    </Suspense>
  )
}
