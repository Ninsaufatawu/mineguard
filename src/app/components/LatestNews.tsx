"use client";

import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { newsItems } from "@/app/news/data/news"; // Import from data file
import { motion, useAnimation } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function LatestNews() {
  // Always display exactly 3 items on desktop, 1 on mobile
  const desktopItemCount = 3;
  const recentNews = newsItems.slice(0, 13); // 3 visible + 10 more to scroll through
  
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (carousel.current) {
        const viewportWidth = window.innerWidth;
        const isMobileView = viewportWidth < 768;
        setIsMobile(isMobileView);
        
        const containerElement = carousel.current.parentElement;
        if (containerElement) {
          setContainerWidth(containerElement.offsetWidth);
        }
        
        setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
        
        // Set card width based on screen size
        if (isMobileView) {
          // On mobile, each card takes full container width (no gap)
          if (containerElement) {
            setCardWidth(containerElement.offsetWidth);
          }
        } else {
          // On desktop, account for gaps between cards
          setCardWidth((carousel.current.offsetWidth - ((desktopItemCount - 1) * 16)) / desktopItemCount);
        }
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [currentIndex, recentNews.length, controls]);

  const getVisibleItemCount = () => {
    return isMobile ? 1 : desktopItemCount;
  };

  const scrollLeft = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      controls.start({
        x: isMobile ? -newIndex * containerWidth : -newIndex * cardWidth,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
    }
  };

  const scrollRight = () => {
    const visibleItems = getVisibleItemCount();
    if (currentIndex < recentNews.length - visibleItems) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      controls.start({
        x: isMobile ? -newIndex * containerWidth : -newIndex * cardWidth,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
    }
  };

  return (
    <section className="py-12 md:py-20 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 md:mb-12">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Latest Updates</h2>
            <p className="text-base md:text-lg text-gray-600">Stay informed about our latest achievements and initiatives</p>
          </div>
          <div className="flex items-center">
            <Link href="/news" className="text-green-600 font-medium hover:underline flex items-center gap-2 text-sm md:text-base">
            View All News
            <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="relative">
          {/* Navigation buttons */}
          <button 
            onClick={scrollLeft}
            className={`absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 p-1.5 md:p-2 rounded-full bg-white shadow-md ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            aria-label="Scroll left"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 md:h-6 md:w-6 text-gray-700" />
          </button>
          
          <button 
            onClick={scrollRight}
            className={`absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 p-1.5 md:p-2 rounded-full bg-white shadow-md ${currentIndex >= recentNews.length - getVisibleItemCount() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            aria-label="Scroll right"
            disabled={currentIndex >= recentNews.length - getVisibleItemCount()}
          >
            <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-gray-700" />
          </button>
          
          {/* Carousel container */}
          <div className="overflow-hidden touch-pan-y">
            {/* Desktop view - Fixed 3 cards */}
            <div className="hidden md:block">
              <div className="grid grid-cols-3 gap-4">
                {recentNews.slice(currentIndex, currentIndex + desktopItemCount).map((item) => (
                  <Card key={item.id} className="h-full shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4" />
                        <span>{item.date}</span>
              </div>
                      <h3 className="text-xl font-semibold mb-3 line-clamp-2">{item.title}</h3>
                      <p className="text-base text-gray-600 mb-4 flex-grow line-clamp-3">
                        {item.excerpt}
                      </p>
                      <Link 
                        href={`/news/${item.id}`} 
                        className="flex items-center gap-2 text-green-600 mt-auto font-medium hover:underline"
                      >
                <ArrowRight className="h-4 w-4" />
                  Read More
                      </Link>
            </CardContent>
          </Card>
                ))}
              </div>
            </div>
            
            {/* Mobile view - Scrollable single card */}
            <div className="md:hidden">
              <motion.div 
                ref={carousel}
                className="flex gap-0"
                animate={controls}
                initial={{ x: 0 }}
                drag={false}
                dragConstraints={{ right: 0, left: -width }}
                dragElastic={0.2}
              >
                {recentNews.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    className="w-full flex justify-center"
                    style={{ 
                      minWidth: containerWidth,
                      padding: '0 12px'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="h-full shadow-md hover:shadow-lg transition-all w-full">
                      <CardContent className="p-4 h-full flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.date}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 flex-grow line-clamp-3">
                          {item.excerpt}
                        </p>
                        <Link 
                          href={`/news/${item.id}`} 
                          className="flex items-center gap-2 text-green-600 mt-auto font-medium hover:underline text-sm"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                  Read More
                        </Link>
            </CardContent>
          </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
              </div>
          
          {/* Pagination dots */}
          <div className="flex justify-center mt-4 md:mt-6 gap-1.5 md:gap-2 overflow-x-auto py-2">
            {Array.from({ length: recentNews.length - getVisibleItemCount() + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  controls.start({
                    x: isMobile ? -index * containerWidth : -index * cardWidth,
                    transition: { type: "spring", stiffness: 300, damping: 30 }
                  });
                }}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${
                  currentIndex === index ? 'bg-green-600 w-3 md:w-4' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
              </div>
        </div>
      </div>
    </section>
  );
}
