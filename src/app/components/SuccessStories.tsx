import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SuccessStories() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Real impact stories from communities where illegal mining activities have been successfully stopped.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="overflow-hidden">
            <Image
              src="/images/sucess-story-1.jpg"
              alt="Success Story 1"
              width={600}
              height={400}
              className="w-full h-48 object-cover object-top"
            />
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Pra River Restoration</h3>
              <p className="text-gray-600 mb-4">
                Community-led initiative successfully restored 5km of river, improving water quality by 70% within 6
                months.
              </p>
              <div className="flex items-center gap-2 text-green-600">
                <ArrowRight className="h-4 w-4" />
                <a href="#" className="font-medium hover:underline">
                  Read Full Story
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <Image
              src="/images/sucess-story-2.jpg"
              alt="Success Story 2"
              width={600}
              height={400}
              className="w-full h-48 object-cover object-top"
            />
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Atewa Forest Recovery</h3>
              <p className="text-gray-600 mb-4">
                Local authorities and communities collaborated to reforest 200 hectares of previously mined land.
              </p>
              <div className="flex items-center gap-2 text-green-600">
                <ArrowRight className="h-4 w-4" />
                <a href="#" className="font-medium hover:underline">
                  Read Full Story
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <Image
              src="/images/sucess-story-3.jpg"
              alt="Success Story 3"
              width={600}
              height={400}
              className="w-full h-48 object-cover object-top"
            />
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Agricultural Revival</h3>
              <p className="text-gray-600 mb-4">
                Former mining land transformed into productive farmland, supporting 150 local families.
              </p>
              <div className="flex items-center gap-2 text-green-600">
                <ArrowRight className="h-4 w-4" />
                <a href="#" className="font-medium hover:underline">
                  Read Full Story
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
