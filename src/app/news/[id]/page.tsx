import { notFound } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { newsItems } from "@/app/news/data/news"

export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = newsItems.find((item) => item.id === params.id)
  if (!post) {
    return {
      title: 'News Article Not Found - MineGuard',
      description: 'The requested article could not be found.'
    }
  }
  
  return {
    title: `${post.title} - MineGuard News`,
    description: post.excerpt
  }
}

export default function NewsPostPage({ params }: { params: { id: string } }) {
  const post = newsItems.find((item) => item.id === params.id)
  
  if (!post) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-32 bg-green-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex items-center gap-2 text-white/80">
            <Calendar className="h-5 w-5" />
            <span>{post.date}</span>
          </div>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <Link href="/news" className="text-green-600 font-medium hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to All News
          </Link>
        </div>
        
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-200">
          <Link href="/news" className="text-green-600 font-medium hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to All News
          </Link>
        </div>
      </div>
    </div>
  )
} 