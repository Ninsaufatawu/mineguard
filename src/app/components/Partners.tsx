import { FlagIcon as Government, Globe, Users, Earth } from "lucide-react"

export default function Partners() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Partners</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Working together with leading organizations to protect Ghana's natural resources
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <Government className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Minerals Commission</h3>
            <p className="text-gray-600 text-center text-sm">Official regulatory body</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <Earth className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Environmental Protection</h3>
            <p className="text-gray-600 text-center text-sm">Agency oversight</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <Users className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Local Communities</h3>
            <p className="text-gray-600 text-center text-sm">Grassroots support</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4">
              <Globe className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">International NGOs</h3>
            <p className="text-gray-600 text-center text-sm">Global collaboration</p>
          </div>
        </div>
      </div>
    </section>
  )
}
