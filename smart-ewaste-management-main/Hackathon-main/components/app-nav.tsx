"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Role = "student" | "coordinator" | "admin" | "vendor"

export function AppNav({ className }: { className?: string }) {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [showBlocked, setShowBlocked] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then(async (r) => {
        if (r.ok) {
          const s = await r.json()
          setRole(s?.user?.role ?? null)
        } else {
          setRole(null)
        }
      })
      .catch((error) => {
        console.error("Error fetching session:", error)
        setRole(null)
      })
  }, [])

  function canAccess(path: string): boolean {
    // Everyone can access the public homepage
    if (path === "/") return true
    if (role === "admin") return true
    if (role === "vendor") return path.startsWith("/vendor")
    if (role === "student" || role === "coordinator") return path.startsWith("/report")
    return false
  }

  function go(path: string) {
    if (canAccess(path)) router.push(path)
    else setShowBlocked(true)
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    if (typeof window !== "undefined") window.location.href = "/"
  }

  return (
    <header className={cn("w-full border-b bg-background", className)}>
      <div className="container flex h-14 items-center justify-center gap-2 sm:gap-4 relative px-4">
        <a onClick={() => go("/")} className="font-semibold cursor-pointer text-center text-xs sm:text-sm md:text-base truncate max-w-[60%] sm:max-w-none">
          SMART E WASTE MANAGEMENT SYSTEM
        </a>
        <div className="absolute right-2 sm:right-4 flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {role ? (
            <Button size="sm" variant="ghost" onClick={onLogout} className="text-xs sm:text-sm px-2 sm:px-3">
              Logout
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-xs sm:text-sm px-2 sm:px-3">
              <a href="/login">Login</a>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showBlocked} onOpenChange={setShowBlocked}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Feature unavailable</DialogTitle>
            <DialogDescription>
              You don't have access to this feature with your current role.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </header>
  )
}
