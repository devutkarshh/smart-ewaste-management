"use client"

import { useEffect, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type Vendor = {
  id: string
  company_name: string
  contact_person: string
  email: string
  cpcb_registration_no: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetch("/api/vendors")
      .then(async (r) => setVendors(await r.json()))
      .catch((error) => console.error("Failed to fetch vendors:", error))
  }, [])

  const filteredVendors = vendors.filter((vendor) =>
    vendor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.cpcb_registration_no.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group vendors by company name
  const vendorsByCompany = filteredVendors.reduce((acc, vendor) => {
    const companyName = vendor.company_name
    if (!acc[companyName]) {
      acc[companyName] = []
    }
    acc[companyName].push(vendor)
    return acc
  }, {} as Record<string, Vendor[]>)

  const uniqueCompanies = Object.keys(vendorsByCompany).length
  const totalVendors = filteredVendors.length

  return (
    <main>
      <AppNav />
      <section className="container py-4 sm:py-8 space-y-4 sm:space-y-8 bg-gradient-to-b from-[#9ac37e]/5 to-transparent min-h-screen px-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#3e5f44]">E-Waste Management Vendors</h1>
            <p className="text-[#3e5f44]/70 text-lg">
              CPCB authorized partners for sustainable e-waste collection and disposal
            </p>
          </div>

          <Card className="border-[#9ac37e]/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#3e5f44]">Vendor Directory</CardTitle>
              <CardDescription>
                All registered vendors with CPCB authorization for e-waste management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="w-full sm:w-96">
                  <Input
                    placeholder="Search vendors by name, contact, email, or CPCB registration..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#9ac37e]/20 text-[#3e5f44]">
                    {uniqueCompanies} compan{uniqueCompanies !== 1 ? 'ies' : 'y'}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#3e5f44]/20 text-[#3e5f44]">
                    {totalVendors} vendor{totalVendors !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <Separator />

              {Object.keys(vendorsByCompany).length > 0 ? (
                <div className="grid gap-6">
                  {/* Desktop table view */}
                  <div className="hidden md:block space-y-6">
                    {Object.entries(vendorsByCompany).map(([companyName, companyVendors]) => (
                      <div key={companyName} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-[#3e5f44]">{companyName}</h3>
                          <Badge variant="outline" className="border-[#9ac37e] text-[#3e5f44]">
                            {companyVendors.length} vendor{companyVendors.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-[200px_250px_200px_100px] gap-4 px-4 py-3 text-sm font-medium text-[#3e5f44] bg-[#9ac37e]/10 rounded-lg">
                          <div>Contact Person</div>
                          <div>Email</div>
                          <div>CPCB Registration</div>
                          <div>Status</div>
                        </div>
                        <div className="space-y-2">
                          {companyVendors.map((vendor) => (
                            <div key={vendor.id} className="grid grid-cols-[200px_250px_200px_100px] gap-4 px-4 py-4 border border-[#9ac37e]/20 rounded-lg hover:bg-[#9ac37e]/5 transition-colors">
                              <div className="text-sm text-[#3e5f44]/80">{vendor.contact_person}</div>
                              <div className="text-sm text-[#3e5f44]/80 break-all">{vendor.email}</div>
                              <div className="text-sm">
                                <Badge variant="outline" className="border-[#9ac37e] text-[#3e5f44]">
                                  {vendor.cpcb_registration_no}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile card view */}
                  <div className="md:hidden space-y-6">
                    {Object.entries(vendorsByCompany).map(([companyName, companyVendors]) => (
                      <div key={companyName} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-[#3e5f44]">{companyName}</h3>
                          <Badge variant="outline" className="border-[#9ac37e] text-[#3e5f44]">
                            {companyVendors.length} vendor{companyVendors.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {companyVendors.map((vendor) => (
                            <Card key={vendor.id} className="border-[#9ac37e]/20">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <p className="text-sm text-[#3e5f44]/80">Contact: {vendor.contact_person}</p>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Active
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium text-[#3e5f44]">Email: </span>
                                    <span className="text-[#3e5f44]/80 break-all">{vendor.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-[#3e5f44]">CPCB Registration:</span>
                                    <Badge variant="outline" className="border-[#9ac37e] text-[#3e5f44] text-xs">
                                      {vendor.cpcb_registration_no}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-[#3e5f44]/60 text-lg mb-2">No vendors found</div>
                  <p className="text-[#3e5f44]/50 text-sm">
                    {searchQuery ? "Try adjusting your search criteria" : "No vendors are currently registered"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#9ac37e]/20">
              <CardContent className="p-4">
                <div className="text-sm text-[#3e5f44]/70 font-medium">Active Companies</div>
                <div className="text-2xl font-bold text-[#3e5f44]">{Object.keys(vendors.reduce((acc, vendor) => {
                  acc[vendor.company_name] = true;
                  return acc;
                }, {} as Record<string, boolean>)).length}</div>
              </CardContent>
            </Card>
            <Card className="border-[#9ac37e]/20">
              <CardContent className="p-4">
                <div className="text-sm text-[#3e5f44]/70 font-medium">Total Vendors</div>
                <div className="text-2xl font-bold text-[#3e5f44]">{vendors.length}</div>
              </CardContent>
            </Card>
            <Card className="border-[#9ac37e]/20">
              <CardContent className="p-4">
                <div className="text-sm text-[#3e5f44]/70 font-medium">CPCB Authorized</div>
                <div className="text-2xl font-bold text-[#3e5f44]">{vendors.length}</div>
              </CardContent>
            </Card>
            <Card className="border-[#9ac37e]/20">
              <CardContent className="p-4">
                <div className="text-sm text-[#3e5f44]/70 font-medium">Coverage</div>
                <div className="text-2xl font-bold text-[#3e5f44]">100%</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
