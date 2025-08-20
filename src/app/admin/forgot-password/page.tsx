"use client"

import { useState } from "react"
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
import { 
  AtSign, 
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
  Mail,
  CheckCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/admin/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
      } else {
        setError(data.message || data.error || "Failed to send reset email")
      }
    } catch (error) {
      setError("Failed to send reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
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
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Password reset instructions sent
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Mail className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-green-800 font-medium mb-2">
                Reset link sent to:
              </p>
              <p className="text-sm text-green-700 font-mono bg-green-100 px-3 py-1 rounded">
                {email}
              </p>
            </div>
            
            <div className="text-sm text-slate-600 space-y-2">
              <p>We've sent you a secure link to reset your password.</p>
              <p>The link will expire in 1 hour for security purposes.</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={() => router.push('/admin/login')}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Didn't receive the email?{" "}
                <button 
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                  }}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </CardFooter>
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-slate-600">
            Enter your admin email to receive reset instructions
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
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Admin Email Address
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@geoguard.com"
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-4">
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Remember your password?{" "}
              <Link href="/admin/login" className="text-purple-600 hover:underline font-medium">
                Back to Login
              </Link>
            </p>
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
