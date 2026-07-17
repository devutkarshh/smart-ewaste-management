"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 px-0 bg-white/10 hover:bg-white/20 border border-white/20"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] text-white" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 px-0 transition-all duration-200 border"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
      }}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-200" style={{ color: isDark ? 'white' : '#3e5f44' }} />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-200" style={{ color: isDark ? 'white' : '#3e5f44' }} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
