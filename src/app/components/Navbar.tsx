"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserMenu from "./auth/UserMenu"
import { useSession } from "next-auth/react"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { data: session, status } = useSession()
  
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const id = href.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className={`font-['Pacifico'] text-2xl ${isScrolled ? 'text-primary' : 'text-white'}`}>
              <Link href="/" onClick={handleSmoothScroll}>
                GeoGuard
              </Link>
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`${isScrolled ? 'text-gray-700' : 'text-white hover:text-white'} hover:text-primary font-medium relative group`}>
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#features" className={`${isScrolled ? 'text-gray-700' : 'text-white hover:text-white '} hover:text-primary font-medium relative group`} onClick={handleSmoothScroll}>
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#how-it-works" className={`${isScrolled ? 'text-gray-700' : 'text-white hover:text-white'} hover:text-primary font-medium relative group`} onClick={handleSmoothScroll}>
              How It Works
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#testimonials" className={`${isScrolled ? 'text-gray-700' : 'text-white hover:text-white'} hover:text-primary font-medium relative group`} onClick={handleSmoothScroll}>
              Testimonials
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/report" className={`${isScrolled ? 'text-gray-700' : 'text-white hover:text-white'} hover:text-primary font-medium relative group`}>
              Report
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <UserMenu session={session} />
            ) : (
              <Link href="/auth">
                <Button className={`${isScrolled ? 'bg-primary text-white' : 'bg-green-600 text-white'} hover:bg-green-700 cursor-pointer`}>
                  Sign In
                </Button>
              </Link>
            )}
            <div className="md:hidden ml-2">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 rounded-md ${isScrolled ? 'text-gray-700' : 'text-white'} cursor-pointer`}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:text-primary font-medium"
              onClick={handleSmoothScroll}
            >
              Home
            </Link>
            <Link
              href="#features"
              className="block px-3 py-2 text-gray-700 hover:text-primary font-medium"
              onClick={handleSmoothScroll}
            >
              Features
            </Link>
            
            <Link
              href="#how-it-works"
              className="block px-3 py-2 text-gray-700 hover:text-primary font-medium"
              onClick={handleSmoothScroll}
            >
              How It Works
            </Link>
            <Link
              href="#testimonials"
              className="block px-3 py-2 text-gray-700 hover:text-primary font-medium"
              onClick={handleSmoothScroll}
            >
              Testimonials
            </Link>
            <Link
              href="/report"
              className="block px-3 py-2 text-gray-700 hover:text-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Report
            </Link>
            
            {!isAuthenticated && (
              <Link
                href="/auth"
                className="block px-3 py-2 text-primary font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
