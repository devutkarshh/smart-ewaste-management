import Link from "next/link"
import Image from "next/image"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/server/auth"
import { listCampaigns } from "@/lib/server/data-mongo"

export default async function Page() {
  let session = null
  let campaigns: any[] = []
  
  try {
    session = await getSession()
  } catch (error) {
    console.error('Error getting session:', error)
  }
  
  try {
    campaigns = await listCampaigns()
  } catch (error) {
    console.error('Error getting campaigns:', error)
  }
  
  const now = new Date()
  const upcoming = campaigns
    .filter((c) => {
      const d = new Date(c.date)
      // Only keep future or today
      return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)
  return (
    <main className="min-h-screen">
      <AppNav />

      {/* Hero - optimized for all devices */}
      <section className="relative min-h-[calc(100svh-56px)] overflow-hidden">
        {/* Background image - optimized */}
        <div className="absolute inset-0">
          <Image
            src="/ewaste-bg.jpg"
            alt="E-waste background"
            fill
            className="object-cover"
            priority
            quality={85}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
        </div>
        
        <div className="container relative min-h-[calc(100svh-56px)] grid place-items-center py-8 px-4 md:py-16">
          <div className="max-w-4xl text-center space-y-6 md:space-y-8">
            {/* Theme toggle for home screen */}
            <div className="absolute top-4 right-4 z-20">
              <ThemeToggle />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-2xl">
              SMART E-WASTE MANAGEMENT
            </h1>
            
            <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
              Residential complexes and campuses generate significant e‑waste: outdated computers, projectors, lab equipment,
              mobile devices, batteries, and accessories. Without awareness and proper tracking, much of it ends up in landfills.
            </p>
            
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-4 max-w-4xl mx-auto">
              {!session ? (
                <>
                  <Button asChild className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="bg-[#9ac37e] hover:bg-[#8bb56f] text-white border-0 px-6 py-3 text-sm sm:text-base font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              ) : null}
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
                <Link href="/report">Report an item</Link>
              </Button>
              {session?.user?.role === "vendor" ? (
                <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
                  <Link href="/vendor/auctions">Auctions</Link>
                </Button>
              ) : session?.user?.role === "admin" ? null : session?.user ? (
                <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
                  <Link href="/my-auctions">My Auctions</Link>
                </Button>
              ) : null}
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
              <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-6 py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl w-full sm:w-auto">
                <Link href="/vendor/scan">Vendor Scan</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content - optimized responsive grid */}
      <section className="container mx-auto py-8 md:py-12 lg:py-16 bg-gradient-to-b from-[#9ac37e]/10 to-transparent px-4 max-w-7xl">
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {upcoming.length > 0 && (
            <Card className="md:col-span-3 border-[#9ac37e]/20 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="bg-gradient-to-r from-[#9ac37e]/5 to-transparent">
                <CardTitle className="text-[#3e5f44] text-lg md:text-xl font-bold">Upcoming campaigns</CardTitle>
                <CardDescription className="text-[#3e5f44]/70 text-sm md:text-base">Open awareness drives and collection events visible to everyone.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcoming.map((c) => (
                    <div key={c.id} className="rounded-lg border border-[#9ac37e]/30 p-3 md:p-4 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 hover:to-[#9ac37e]/5 transition-all duration-200 hover:shadow-sm">
                      <div className="text-xs md:text-sm text-[#3e5f44]/70 font-medium">{new Date(c.date).toLocaleDateString()}</div>
                      <div className="font-semibold text-[#3e5f44] mt-1 text-sm md:text-base">{c.title}</div>
                      {c.description ? (
                        <div className="text-xs md:text-sm text-[#3e5f44]/60 line-clamp-3 mt-2">{c.description}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-1 border-[#9ac37e]/20 shadow-md hover:shadow-lg transition-all duration-200">
            <CardHeader className="bg-gradient-to-br from-[#9ac37e]/10 to-[#9ac37e]/5 p-4 md:p-6">
              <CardTitle className="text-[#3e5f44] text-base md:text-lg font-bold">Why it matters</CardTitle>
              <CardDescription className="text-[#3e5f44]/70 text-xs md:text-sm">
                Poor tracking and insufficient recycling infrastructure lead to environmental and health risks. Our platform fixes that.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs md:text-sm text-[#3e5f44]/80 leading-relaxed p-4 md:p-6">
              HH302 brings awareness, traceability, and compliance to e‑waste management with an end‑to‑end digital workflow.
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-[#9ac37e]/20 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-[#9ac37e]/5 to-transparent p-4 md:p-6">
              <CardTitle className="text-[#3e5f44] text-base md:text-lg font-bold">Features</CardTitle>
              <CardDescription className="text-[#3e5f44]/70 text-xs md:text-sm">Everything you need for responsible e‑waste lifecycle management.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 text-xs md:text-sm p-4 md:p-6">
              {[
                { title: "1. Centralized Portal", desc: "Log, track, and manage disposal by department, category, age, and more." },
                { title: "2. QR Tagging", desc: "Unique QR codes follow each item from reporting to final disposal." },
                { title: "3. Smart Scheduling", desc: "Categorization and vendor pickup scheduling for efficient operations." },
                { title: "4. Compliance & Reporting", desc: "CPCB/E‑Waste Rules aligned reporting for audits and traceability." },
                { title: "5. Engagement & Awareness", desc: "Campaigns, challenges, and collection drives to boost participation." },
                { title: "6. Analytics Dashboard", desc: "Trends, recovery rates, and environmental impact of recycling." }
              ].map((feature, index) => (
                <div key={index} className="rounded-lg border border-[#9ac37e]/30 p-3 bg-gradient-to-br from-[#9ac37e]/5 to-transparent hover:from-[#9ac37e]/10 transition-all duration-200 hover:shadow-sm">
                  <div className="font-semibold text-[#3e5f44] text-xs md:text-sm">{feature.title}</div>
                  <div className="text-[#3e5f44]/70 mt-1 text-xs">{feature.desc}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-[#9ac37e]/20 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-[#9ac37e]/5 to-transparent p-4 md:p-6">
              <CardTitle className="text-[#3e5f44] text-lg md:text-xl font-bold">How it works</CardTitle>
              <CardDescription className="text-[#3e5f44]/70 text-sm md:text-base">Report → Tag with QR → Schedule pickup → Vendor collection → Final disposal</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:gap-3 text-xs md:text-sm p-4 md:p-6">
              {[
                "Students/Faculty report e‑waste and get a printable QR code.",
                "Item is stored at the department collection point.",
                "Admin categorizes and schedules a vendor pickup.",
                "Vendor scans QR on collection; status updates in real-time.",
                "Lifecycle recorded for compliance and analytics."
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-2 md:p-3 rounded-lg bg-gradient-to-r from-[#9ac37e]/10 to-transparent border-l-4 border-[#3e5f44] hover:from-[#9ac37e]/15 transition-all duration-200">
                  <span className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-[#3e5f44] text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                    {index + 1}
                  </span>
                  <span className="text-[#3e5f44] text-xs md:text-sm">{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
