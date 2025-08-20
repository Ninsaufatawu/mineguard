import Image from "next/image"
import { Smartphone, Activity, FlagIcon as Government, Check, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform combines citizen reporting with advanced satellite monitoring to detect and stop illegal mining
            activities.
          </p>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <Card className="relative z-10">
              <CardContent className="p-8">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100 text-green-700 rounded-full mb-6 mx-auto">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="absolute top-22 left-52 -translate-x-1/2 w-7 h-7 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">Citizen Reporting</h3>
                <p className="text-gray-600 text-center">
                  Citizens report suspicious mining activities anonymously via web or mobile app with location data and
                  photos.
                </p>
              </CardContent>
            </Card>
            <Card className="relative z-10">
              <CardContent className="p-8">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100  text-green-700 rounded-full mb-6 mx-auto">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="absolute top-22 left-52 -translate-x-1/2 w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">AI Analysis</h3>
                <p className="text-gray-600 text-center">
                  Our AI system compares reports with satellite imagery and environmental data to verify illegal
                  activities.
                </p>
              </CardContent>
            </Card>
            <Card className="relative z-10">
              <CardContent className="p-8">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100 text-green-700 rounded-full mb-6 mx-auto">
                  <Government className="h-6 w-6" />
                </div>
                <div className="absolute top-22 left-52 -translate-x-1/2 w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold text-center mb-4">Authority Response</h3>
                <p className="text-gray-600 text-center">
                  Authorities receive real-time alerts with detailed information for rapid enforcement action.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-16">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                  <h3 className="text-2xl font-semibold mb-4">Advanced Technology Platform</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center text-green-700  mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Satellite Monitoring</h4>
                        <p className="text-gray-600">Daily updates from Google Earth Engine to track land changes</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center text-green-700  mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Machine Learning</h4>
                        <p className="text-gray-600">AI algorithms detect mining signatures in imagery</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center text-green-700  mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Secure Reporting</h4>
                        <p className="text-gray-600">End-to-end encrypted submissions protect citizen identity</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-green-700  mt-0.5">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">Real-time Alerts</h4>
                        <p className="text-gray-600">Immediate notifications to relevant authorities</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="w-full md:w-1/2">
                  <Image
                    src="/images/tech-1.jpg"
                    alt="Control Room"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg shadow-sm object-top"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
