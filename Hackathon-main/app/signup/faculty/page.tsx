"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

const departments = [
  "Computer Science",
  "Electrical Engineering", 
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Biotechnology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Administration",
  "Other"
]

function FacultySignupForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return false
    }
    if (!formData.password) {
      setError("Password is required")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!formData.department) {
      setError("Please select a department")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: "coordinator",
          department: formData.department
        }),
      })

      const result = await response.json()

      if (response.ok) {
        router.push("/login/faculty?message=Account created successfully! Please sign in.")
      } else {
        setError(result.error || "Failed to create account")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      <Card className="border-[#9ac37e]/20 shadow-2xl backdrop-blur-sm bg-card/95 dark:bg-card/90">
        <CardHeader>
          <CardTitle className="text-[#3e5f44] dark:text-[#9ac37e] text-2xl font-bold">Faculty / Coordinator Sign Up</CardTitle>
          <CardDescription className="text-[#3e5f44]/70 dark:text-[#9ac37e]/70">Create your faculty account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required 
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white dark:bg-[#9ac37e] dark:hover:bg-[#8bb56f] dark:text-[#1a2e0a] py-3 text-lg font-semibold"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center mt-2">
              <p className="text-sm text-[#3e5f44]/70 dark:text-[#9ac37e]/70">
                Already have an account?{" "}
                <Link href="/login/faculty" className="text-[#3e5f44] dark:text-[#9ac37e] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FacultySignupPage() {
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
      <Suspense fallback={<div className="w-full max-w-md relative z-10 animate-pulse"><div className="h-96 bg-card/50 rounded-lg"></div></div>}>
        <FacultySignupForm />
      </Suspense>
    </main>
  )
}
