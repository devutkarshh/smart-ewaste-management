import { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SpecialLayoutProps {
  children: ReactNode
  className?: string
  backgroundImage?: string
  showHomeButton?: boolean
  showThemeToggle?: boolean
}

export function SpecialLayout({
  children,
  className,
  backgroundImage = "/ewaste-bg.jpg",
  showHomeButton = true,
  showThemeToggle = true
}: SpecialLayoutProps) {
  return (
    <main className={cn("min-h-[100svh] grid place-items-center p-4 relative overflow-hidden", className)}>
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('${backgroundImage}')`
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/80" />
      
      {/* Home button */}
      {showHomeButton && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-background/10 hover:bg-background/20 text-foreground border border-border/20 backdrop-blur-sm transition-all duration-200 hover:scale-105 h-8 w-8 sm:h-10 sm:w-10"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      )}
      
      {/* Theme toggle */}
      {showThemeToggle && (
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20">
          <ThemeToggle />
        </div>
      )}
      
      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-2xl mx-4">
        {children}
      </div>
    </main>
  )
}
