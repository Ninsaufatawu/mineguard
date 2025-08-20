import Image from "next/image"
import { Satellite, Activity, Database, ShieldCheck, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function TechnologySection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Cutting-Edge Technology</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform leverages advanced technology to protect Ghana's environment
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <Card className="overflow-hidden">
              <div className="relative">
                <Image
                  src="/images/computer setup.jpg"
                  alt="Technology Platform"
                  width={600}
                  height={400}
                  className="w-full h-64 object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-sm font-medium">Live Monitoring Center</div>
                  <div className="text-xs opacity-75">24/7 Environmental Surveillance</div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                      <Satellite className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Satellite Coverage</div>
                      <div className="text-gray-500">95% of mining regions</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">AI Analysis</div>
                      <div className="text-gray-500">Real-time detection</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Data Processing</div>
                      <div className="text-gray-500">5TB daily analysis</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Security</div>
                      <div className="text-gray-500">End-to-end encrypted</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Advanced Monitoring System</h3>
                <p className="text-gray-600 mb-6">
                  Our platform combines satellite imagery, AI analysis, and ground reports to provide comprehensive
                  environmental monitoring.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 flex items-center justify-center text-primary mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Machine Learning Detection</h4>
                      <p className="text-gray-600">
                        AI algorithms identify illegal mining activities with 98% accuracy
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 flex items-center justify-center text-primary mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Real-time Alerts</h4>
                      <p className="text-gray-600">Instant notifications to authorities and stakeholders</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 flex items-center justify-center text-primary mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">Data Analytics</h4>
                      <p className="text-gray-600">Comprehensive reporting and trend analysis</p>
                    </div>
                  </li>
                </ul>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">System Performance</h4>
                    <div className="text-sm text-gray-500">Last 30 days</div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Detection Accuracy</span>
                        <span className="font-medium bg-gree">98%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 rounded-full" style={{ width: "98%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Response Time</span>
                        <span className="font-medium">{"< 5 mins"}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600  rounded-full" style={{ width: "95%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>System Uptime</span>
                        <span className="font-medium">99.9%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600  rounded-full" style={{ width: "99.9%" }}></div>
                      </div>
                    </div>
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
