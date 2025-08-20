"use client"

import Image from "next/image"
import { Flag, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export default function CtaSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-green-100/60 rounded-xl p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Make a Difference?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of citizens who are helping protect Ghana's environment. Your action today can save our
                natural resources for tomorrow.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/report">
                  <Button className="bg-green-700/90 hover:bg-green-800/90">
                    <Flag className="mr-2 h-5 w-5" />
                    Report Illegal Mining
                  </Button>
                </Link>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  variant="outline" 
                  className="border-2 border-green-500 text-primary hover:bg-primary/5"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Join Our Network
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/people-ready.jpg"
                alt="Community Action"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-green-600">5000+</div>
                  <div className="text-sm text-gray-600">
                    Active community
                    <br />
                    volunteers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <>
          {/* Prevent body scroll when modal is open */}
          <style jsx global>{`
            body {
              overflow: hidden;
            }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <div className="relative z-10 w-full max-w-lg mx-auto">
              <div className="h-auto">
                <JoinNetworkForm onClose={() => setIsModalOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function JoinNetworkForm({ onClose }: { onClose: () => void }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    reason: "",
    phone: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    // Handle form submission here
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-7">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Our Network!</h2>
          <p className="text-gray-600 mb-5 text-base">
            Thank you for joining the MineGuard community. We'll be in touch with opportunities to get involved.
          </p>
          <div className="flex justify-center">
            <button onClick={onClose} className="text-green-600 hover:text-green-700 font-medium text-base px-6 py-2 border border-green-200 rounded-lg hover:bg-green-50">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-7 mt-16">
      <div className="flex justify-between items-center mb-5">
        <div className="w-12 h-12 invisible"></div>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Our Network</h1>
        <p className="text-gray-600 text-base">Become part of Ghana's environmental protection community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-2">
              Location in Ghana *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Region"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="e.g., 024 123 4567"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-900 mb-2">
            Why do you want to join? *
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            placeholder="Tell us why you're interested in joining our network"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-base"
          />
        </div>

        <button
          type="submit"
          disabled={!formData.name.trim() || !formData.email.trim() || !formData.location.trim() || !formData.reason.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-base"
        >
          Join Network
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500">
          By joining, you agree to our{" "}
          <a href="#" className="text-green-600 hover:text-green-700 font-medium">
            terms and conditions
          </a>
        </p>
      </div>
    </div>
  )
}
