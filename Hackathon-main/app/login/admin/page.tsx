"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("admin123")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") || "" : ""

  return (
    <main className="min-h-[100svh] grid place-items-center p-4 relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/ewaste-bg.jpg')`
        }}
      ></div>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d5016]/80 via-[#3e5f44]/70 to-[#1a2e0a]/80"></div>
      
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md relative z-10">
        <Card className="border-[#9ac37e]/20 shadow-2xl backdrop-blur-sm bg-card/95 dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-[#3e5f44] dark:text-[#9ac37e] text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription className="text-[#3e5f44]/70 dark:text-[#9ac37e]/70">Use your admin credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/login" method="post" className="grid gap-4">
              <input type="hidden" name="from" value={from} />
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white dark:bg-[#9ac37e] dark:hover:bg-[#8bb56f] dark:text-[#1a2e0a] py-3 text-lg font-semibold">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}