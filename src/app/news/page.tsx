import { ArrowRight, Calendar, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { newsItems } from "@/app/news/data/news" // We'll create this data file separately

export const metadata = {
  title: 'Latest News - MineGuard',
  description: 'Stay updated with the latest news and developments from MineGuard.'
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-32 bg-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Latest News</h1>
            <p className="text-xl text-white/90 max-w-3xl">
              Stay informed about our latest updates, achievements, and initiatives in the fight against illegal mining.
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link href="/" className="text-green-600 font-medium hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{item.date}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-4">
                  {item.excerpt}
                </p>
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowRight className="h-4 w-4" />
                  <Link href={`/news/${item.id}`} className="font-medium hover:underline">
                    Read More
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 