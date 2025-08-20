"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BarChart3 } from "lucide-react"
import { useState } from "react"

export default function FaqSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const faqs = [
    {
      id: "item-1",
      question: "What is MineGuard and how can it help protect our environment?",
      answer:
        "MineGuard is a technology platform that helps identify and report illegal mining activities in Ghana. It combines satellite monitoring, community reporting, and government action to protect our natural resources.",
    },
    {
      id: "item-2",
      question: "How do I report illegal mining activities?",
      answer:
        "You can submit reports through our mobile app or website. Simply provide location details, upload photos if available, and submit the report anonymously. We'll verify and forward it to authorities.",
    },
    {
      id: "item-3",
      question: "Is my identity protected when I report illegal mining?",
      answer:
        "Yes, all reports are completely anonymous. We use end-to-end encryption and secure systems to protect your identity and ensure your safety.",
    },
    {
      id: "item-4",
      question: "How can I join the fight against illegal mining?",
      answer:
        "Besides reporting activities, you can join our community volunteer program, participate in environmental awareness campaigns, or partner with us for enhanced monitoring in your area.",
    },
    {
      id: "item-5",
      question: "What are the requirements for obtaining a mining license in Ghana?",
      answer:
        "To obtain a mining license, you need to submit an application to the Minerals Commission with documentation including environmental impact assessment, land ownership proof, technical and financial proposals, and pay the necessary fees. Our platform guides you through each step of this process.",
    },
    {
      id: "item-6",
      question: "How long does it take to process a mining license application?",
      answer:
        "The processing time typically takes 3-6 months depending on the type of license and completeness of your application. Through MineGuard, you can track your application status in real-time and receive updates on any requirements or changes needed.",
    },
  ]

  return (
    <div className="bg-gray-50 px-6 py-12 lg:px-12 lg:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column */}
          <div className="space-y-10 lg:sticky lg:top-20">
            <div className="space-y-6">
              <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1.5 text-sm font-medium inline-flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                MineGuard Protecting Ghana's Future
              </Badge>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Frequently asked questions
              </h1>
            </div>

            <Card className="bg-green-100/50 border-0 shadow-none">
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3">Still have a questions?</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm lg:text-base">
                  Can't find the answer to your question? Send us an email and we'll get back to you as soon as
                  possible.
                </p>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm"
                >
                  Ask Question  
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <Accordion type="single" collapsible defaultValue="item-1" className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-white border-0 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline px-5 py-5 text-base leading-relaxed [&>svg]:ml-auto [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-gray-500">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-5 pb-5 pt-0 leading-relaxed text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
                <ContactForm onClose={() => setIsModalOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ContactForm({ onClose }: { onClose: () => void }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [question, setQuestion] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    // Handle form submission here
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Question Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thanks for your question. We'll review it and add it to our FAQ if it helps others.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => setIsSubmitted(false)} className="text-green-600 hover:text-green-700 font-medium">
              Ask another question
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-medium">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mt-16">
      <div className="flex justify-between items-center mb-6">
        <div className="w-12 h-12 invisible"></div>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ask a Question</h1>
        <p className="text-gray-600">Can't find what you're looking for? Ask us anything!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="question" className="block text-sm font-semibold text-gray-900 mb-3">
            What's your question? *
          </label>
          <textarea
            id="question"
            name="question"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="e.g., How do I report illegal mining in my area? What are the penalties for illegal mining?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Be specific to help others with similar questions</p>
            <span className="text-xs text-gray-400">{question.length}/500</span>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-3">
            Email (optional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          />
          <p className="text-xs text-gray-500 mt-2">Only if you want a personal response</p>
        </div>

        <button
          type="submit"
          disabled={!question.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          Submit Question
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500">
          Already checked our{" "}
          <button onClick={onClose} className="text-green-600 hover:text-green-700 font-medium">
            existing FAQs
          </button>
          ?
        </p>
      </div>
    </div>
  )
}
