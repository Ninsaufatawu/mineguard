import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Partners Say</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Hear from the stakeholders who are using our platform to protect Ghana's environment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border border-gray-100">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden">
                  <Image
                    src="/images/test-1.jpg"
                    alt="Dr. Kwame Mensah"
                    width={100}
                    height={100}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Dr. Kwame Mensah</h4>
                  <p className="text-sm text-gray-500">Minerals Commission</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                "This platform has revolutionized our enforcement capabilities. We can now respond to illegal mining
                activities within hours instead of weeks, significantly reducing environmental damage."
              </p>
              <div className="flex text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-100">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden">
                  <Image
                    src="/images/test-2.jpg"
                    alt="Abena Osei"
                    width={100}
                    height={100}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Abena Osei</h4>
                  <p className="text-sm text-gray-500">Green Ghana Foundation</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                "The citizen reporting feature has empowered local communities to take action. We've seen a 40% increase
                in verified reports leading to successful enforcement operations."
              </p>
              <div className="flex text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-100">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden">
                  <Image
                    src="/images/test-3.jpg"
                    alt="Chief Nana Adu"
                    width={100}
                    height={100}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Chief Nana Adu</h4>
                  <p className="text-sm text-gray-500">Akyem Traditional Council</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                "Our community has suffered greatly from water pollution caused by galamsey. This system has helped
                restore our river and farmlands by quickly identifying and stopping illegal operations."
              </p>
              <div className="flex text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-16 bg-green-100/60  rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-2/3">
              <h3 className="text-2xl font-semibold mb-4">Join Our Mission to Protect Ghana's Environment</h3>
              <p className="text-gray-600 mb-6">
                Together, we can stop illegal mining and preserve our natural resources for future generations. Report
                suspicious activities, apply for legal mining permits, or partner with us to expand our monitoring
                capabilities.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/report">
                  <Button className="bg-green-700 hover:bg-green-700/90">Report Illegal Mining</Button>
                </Link>
                <Button variant="outline" className="border-green-700 text-green-700 hover:bg-green-700/5">
                  Become a Partner
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-4">Get Updates</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Stay informed about our efforts and impact with our monthly newsletter.
                  </p>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Button className="rounded-l-none py-2 h-12 bg-green-700 hover:bg-green-700/90">Subscribe</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
