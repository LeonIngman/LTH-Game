import Link from "next/link"
import Image from "next/image"
import { ArrowRight, TruckIcon, FactoryIcon, BarChart3Icon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#e6f0ff]">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 w-full">
        <div className="w-full max-w-6xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <TruckIcon className="h-6 w-6 text-[#0066cc] mr-2" />
            <h1 className="text-xl font-bold text-[#003366]">Supply Chain Logistics</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button className="bg-[#0066cc] hover:bg-[#003366] text-white">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-[#e6f0ff] to-white">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-[#e6f0ff] px-3 py-1 text-sm text-[#0066cc]">
                  Educational Game
                </div>
                <h2 className="text-3xl font-bold tracking-tighter text-[#003366] sm:text-4xl md:text-5xl">
                  Master Supply Chain Management
                </h2>
                <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Experience the challenges of managing a complex supply chain network. Order materials, manage
                  production, and fulfill customer demands in this interactive simulation.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/signin">
                    <Button className="w-full min-[400px]:w-auto bg-[#0066cc] hover:bg-[#003366] text-white">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" className="w-full min-[400px]:w-auto border-[#0066cc] text-[#0066cc]">
                      Learn More
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 italic">
                  Note: This is a classroom tool. Your teacher will provide you with login credentials for your group.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-md rounded-xl border border-[#4d94ff] shadow-lg overflow-hidden bg-white">
                  <Image
                    src="/images/supply-chain.png"
                    alt="Supply Chain Map"
                    width={600}
                    height={300}
                    className="rounded-xl w-full h-auto"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 bg-white">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-[#e6f0ff] px-3 py-1 text-sm text-[#0066cc]">
                  Game Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter text-[#003366] sm:text-4xl md:text-5xl">
                  Learn Real-World Skills
                </h2>
                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our logistics simulation game teaches practical skills through engaging collaborative gameplay
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 rounded-lg border border-[#e6f0ff] bg-white p-6 shadow-sm">
                <div className="rounded-full bg-[#e6f0ff] p-3">
                  <FactoryIcon className="h-6 w-6 text-[#0066cc]" />
                </div>
                <h3 className="text-xl font-bold text-[#003366]">Production Management</h3>
                <p className="text-center text-gray-600">
                  Balance production capacity with demand and manage your factory operations efficiently.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border border-[#e6f0ff] bg-white p-6 shadow-sm">
                <div className="rounded-full bg-[#e6f0ff] p-3">
                  <TruckIcon className="h-6 w-6 text-[#0066cc]" />
                </div>
                <h3 className="text-xl font-bold text-[#003366]">Supply Chain Visualization</h3>
                <p className="text-center text-gray-600">
                  See your supply chain in action with our interactive map showing material flow from suppliers to
                  customers.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border border-[#e6f0ff] bg-white p-6 shadow-sm">
                <div className="rounded-full bg-[#e6f0ff] p-3">
                  <BarChart3Icon className="h-6 w-6 text-[#0066cc]" />
                </div>
                <h3 className="text-xl font-bold text-[#003366]">Performance Analytics</h3>
                <p className="text-center text-gray-600">
                  Track your performance with detailed analytics on costs, inventory levels, and customer satisfaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-12 md:py-24 bg-[#003366] text-white">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Test Your Team's Skills?
                </h2>
                <p className="md:text-xl/relaxed">
                  Join thousands of students who are learning supply chain management through our interactive
                  simulation. Work together in groups to make strategic decisions and optimize your supply chain.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/signin">
                    <Button className="w-full min-[400px]:w-auto bg-white text-[#003366] hover:bg-[#e6f0ff]">
                      Sign In to Your Group Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-[#a3c2e8]">
                  For teachers: Contact your administrator to set up group accounts for your class.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-[#00254d] p-4">
                    <span className="text-3xl font-bold">3</span>
                    <span className="text-sm text-[#4d94ff]">Difficulty Levels</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-[#00254d] p-4">
                    <span className="text-3xl font-bold">30+</span>
                    <span className="text-sm text-[#4d94ff]">Game Days</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-[#00254d] p-4">
                    <span className="text-3xl font-bold">5+</span>
                    <span className="text-sm text-[#4d94ff]">Suppliers</span>
                  </div>
                </div>
                <div className="rounded-lg bg-[#00254d] p-4">
                  <blockquote className="border-l-4 border-[#00a3e0] pl-4 italic">
                    "This simulation helped our team understand supply chain concepts better than any textbook."
                    <footer className="mt-2 text-sm text-[#4d94ff]">— Business Student Group</footer>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white w-full">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-2 py-6 text-center text-sm text-gray-500 md:flex-row md:justify-between md:text-left px-4 md:px-6">
          <p>© 2024 Supply Chain Logistics Game. All rights reserved.</p>
          <p>University Course Project</p>
        </div>
      </footer>
    </div>
  )
}
