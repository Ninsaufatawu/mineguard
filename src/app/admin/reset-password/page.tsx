"use client"

<<<<<<< HEAD
import { useState, useEffect, Suspense } from "react"
=======
import { useState, useEffect } from "react"
>>>>>>> fefd978cdfd5dba4daf1b4898b3b34f3a6ce01ab
import { useSearchParams } from "next/navigation"
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
  KeyRound, 
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

<<<<<<< HEAD
function ResetPasswordContent() {
=======
export default function ResetPasswordPage() {
>>>>>>> fefd978cdfd5dba4daf1b4898b3b34f3a6ce01ab
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token")
      setTokenValid(false)
      return
    }
    
    // Validate token on page load
    validateToken()
  }, [token])
  
  const validateToken = async () => {
    try {
      const response = await fetch('/admin/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      
      if (response.ok && data.valid) {
        setTokenValid(true)
      } else {
        setError(data.message || "Invalid or expired reset token")
        setTokenValid(false)
      }
    } catch (error) {
      setError("Failed to validate reset token")
      setTokenValid(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (!password || !confirmPassword) {
      setError("Please fill all required fields")
      setIsLoading(false)
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/admin/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/login')
        }, 3000)
      } else {
        setError(data.message || data.error || "Failed to reset password")
      }
    } catch (error) {
      setError("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4 flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                {error || "The reset link you used is either invalid or has expired. Please request a new password reset."}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={() => router.push('/admin/forgot-password')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Request New Reset Link
            </Button>
            
            <Button
              onClick={() => router.push('/admin/login')}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4 flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              Password Reset Successful
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Your password has been updated successfully
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium mb-2">
                Password Updated Successfully!
              </p>
              <p className="text-sm text-green-700">
                You can now login with your new password.
              </p>
            </div>
            
            <div className="text-sm text-slate-600">
              <p>Redirecting to login page in 3 seconds...</p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={() => router.push('/admin/login')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-slate-600">Validating reset token...</p>
            </div>
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Set New Password
          </CardTitle>
          <CardDescription className="text-center text-slate-600">
            Enter your new admin password below
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
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                New Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Must match confirmation password</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-5 w-5" />
                  Update Password
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
<<<<<<< HEAD

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
=======
>>>>>>> fefd978cdfd5dba4daf1b4898b3b34f3a6ce01ab
