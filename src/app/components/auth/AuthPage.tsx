"use client"

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

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
import { 
  AtSign, 
  KeyRound, 
  Loader2,
  AlertCircle,
  Leaf,
  ArrowLeft
} from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthPage() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authError = searchParams.get("error")
  
  // Handle NextAuth errors
  useEffect(() => {
    if (authError) {
      switch (authError) {
        case "AccessDenied":
          setError("Access denied. You may not have permission to sign in")
          break
        case "OAuthAccountNotLinked":
          setError("Email already in use with a different provider")
          break
        case "OAuthSignin":
        case "OAuthCallback":
          setError("Error occurred during authentication")
          break
        default:
          setError("Authentication failed. Please try again.")
      }
    }
  }, [authError])
  
  // Redirect if already signed in
  useEffect(() => {
    if (status === "authenticated" && session) {
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      router.push(callbackUrl)
    }
  }, [session, status, router, searchParams])

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
      // Sign in using NextAuth's credential provider
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      
      if (result?.error) {
        setError(result.error === "CredentialsSignin" 
          ? "Invalid email or password" 
          : "Authentication failed")
      }
      
      // Successful login will redirect automatically due to our session check
    } catch (error) {
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    signIn('google', { callbackUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <Card className="w-full max-w-md shadow-md border-0">
        <div className="w-full relative p-4">
          <a href="/" className="absolute top-4 left-4 p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors">
            <ArrowLeft size={20} className="text-green-700" />
            </a>
        </div>

        <CardHeader className="pb-4 flex flex-col items-center space-y-2">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-1">
            <Leaf className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-green-800">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign in to your GeoGuard account
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
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" strokeWidth={2} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 h-12 border border-gray-300 rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" strokeWidth={2} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 h-12 border border-gray-300 rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div></div>
              <a href="#" className="text-sm text-green-600 hover:text-green-800 hover:underline font-medium">
                  Forgot password?
              </a>
              </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="relative mt-6 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 py-1 text-gray-500 text-sm">
                Or continue with
              </span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 rounded-md"
            onClick={handleGoogleSignIn}
          >
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            <span className="font-medium text-gray-700">Sign in with Google</span>
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center pt-1 pb-6">
          <div className="text-sm text-center">
            Don't have an account?
            <a href="/auth/register" className="text-green-600 ml-1.5 hover:text-green-800 hover:underline font-medium">
              Create account
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 