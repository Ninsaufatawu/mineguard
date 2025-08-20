"use client"
import { RefreshCw, CheckCheck, UserIcon as UserVoice } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
const EChartsReact = dynamic(() => import("echarts-for-react"), { ssr: false })

// Types for our mining sites
interface MiningSite {
  id: string;
  type: "legal" | "illegal";
  name: string;
  details: string;
  lastUpdated: string;
}

export default function MapSection() {
  // State for mining sites stats
  const [miningStats, setMiningStats] = useState({
    legal: 5,
    illegal: 13,
    lastUpdateTime: new Date().toLocaleString()
  });

  // Refresh map data manually
  const refreshData = useCallback(() => {
    // Simulate fetching new data
    setMiningStats(prev => ({
      legal: prev.legal + (Math.random() > 0.7 ? 1 : 0),
      illegal: prev.illegal + (Math.random() > 0.5 ? 1 : 0),
      lastUpdateTime: new Date().toLocaleString()
    }));
  }, []);

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Monitoring System</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our GIS-based platform provides real-time monitoring of mining activities across Ghana, helping authorities
            identify and address illegal operations.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-[500px] map-container relative">
              {/* Video Map */}
              <div className="relative w-full h-full">
                <video
                  src="/images/map-v.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                {/* Map Legend Overlay */}
                <div className="absolute top-4 right-4 bg-white p-3 rounded shadow-md z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Legal Mining ({miningStats.legal})</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Illegal Mining ({miningStats.illegal})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-300 to-red-500 rounded-full"></div>
                  <span className="text-sm">Risk Areas</span>
                </div>
              </div>
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded shadow-md z-10">
                  <p className="text-sm text-gray-600">Satellite monitoring in progress</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Mining Sites Detected: {miningStats.legal + miningStats.illegal}</span>
                </div>
                
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/3 flex flex-col gap-12">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                    <CheckCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Enforcement Actions</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Sites shut down</span>
                    <span className="font-semibold">{Math.floor(miningStats.illegal * 0.4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Equipment seized</span>
                    <span className="font-semibold">{Math.floor(miningStats.illegal * 1.7)} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Arrests made</span>
                    <span className="font-semibold">{Math.floor(miningStats.illegal * 0.9)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="bg-green-600/10 p-6 rounded-lg border border-green-700/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-green-400/20 bg-opacity-20 text-primary rounded-full">
                  <UserVoice className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-green-600">Make a Difference</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Your reports help us identify and stop illegal mining activities. Together, we can protect Ghana's
                natural resources.
              </p>
              <Link href="/report">
                <Button className="w-full bg-green-700 hover:bg-primary/90">Report Illegal Activity</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
