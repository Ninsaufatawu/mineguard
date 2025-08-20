"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Flag, Shield, Users, Award, Upload, FileSignature } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function HeroSection() {
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleLicenseClick = () => {
    if (session) {
      // User is authenticated, go directly to license page
      router.push('/license')
    } else {
      // User is not authenticated, redirect to auth page with return URL
      router.push('/auth?callbackUrl=' + encodeURIComponent('/license'))
    }
  }

  return (
    <section className="hero-section min-h-[90vh] sm:min-h-screen flex items-center pt-5 sm:pt-7">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="flex flex-col md:flex-row items-center">        
      <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-black/95 z-10"></div>

        
      
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-28 lg:py-32">
        <div className="text-center md:text-left max-w-3xl">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium text-white">NATURAL ENVIRONMENT</span>
          </div>
          
          <h1 className="text-2xl md:text-5xl lg:text-5xl font-bold mb-6 leading-tight text-white">
            GeoGuard Protecting Ghana's Future
          </h1>
          
          <p className="text-m md:text-lg mb-12 opacity-90 max-w-2xl text-white">
            Protecting Ghana's lands from illegal mining. Join our technology-driven effort to safeguard natural resources and mining operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-6">
              <Link href="/report">
                <Button
                  className="bg-green-600 text-white hover:bg-green-600/80 px-4 sm:px-5 py-2 sm:py-6 h-12 sm:h-14 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
                >
                  <FileSignature className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  Report Illegal Mining
                </Button>
              </Link>
              <Button
                onClick={handleLicenseClick}
                className="bg-transparent border border-white/20 text-white hover:bg-white/30 px-8 py-6 h-14 rounded-md text-sm cursor-pointer w-full sm:w-auto"
              >
                <Flag className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                Apply for Mining License
              </Button>
              
            </div>
        </div>
      </div>
      
      
      {/* Plant image positioned to the right */}
      <div className="w-full md:w-1/2 relative flex justify-center z-10">
            <div className="absolute -top-10 sm:-top-16 -right-10 sm:-right-16 w-40 sm:w-60 h-40 sm:h-60 bg-primary opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 sm:-bottom-16 -left-10 sm:-left-16 w-40 sm:w-60 h-40 sm:h-60 bg-green-500 opacity-20 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="absolute -top-3 sm:-top-5 -left-3 sm:-left-5 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-10">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                    <Shield className="w-3 sm:w-4 h-3 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">Protected Area</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">+2,500 hectares this month</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 sm:-bottom-5 -right-3 sm:-right-5 bg-white rounded-lg shadow-lg p-2 sm:p-3 z-10">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                    <Users className="w-3 sm:w-4 h-3 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">Active Reports</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">150+ this week</div>
                  </div>
                </div>
              </div>
              <div className="relative w-[320px] sm:w-[500px] h-[280px] sm:h-[350px] overflow-hidden">
                <Image
                  src="/images/bg-forest.jpg"
                  alt="Protected Forest"
                  fill
                  sizes="(max-width: 640px) 100vw, 500px"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
