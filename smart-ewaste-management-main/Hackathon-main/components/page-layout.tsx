"use client"

import { ReactNode } from "react"
import { AppNav } from "@/components/app-nav"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  showNav?: boolean
  containerClassName?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export function PageLayout({
  children,
  className,
  title,
  description,
  showNav = true,
  containerClassName,
  maxWidth = "full"
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-none"
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {showNav && <AppNav />}
      
      {title && (
        <div className="border-b bg-muted/50">
          <div className={cn(
            "container px-4 py-6",
            maxWidthClasses[maxWidth],
            containerClassName
          )}>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <main className={cn(
        "container px-4 py-6",
        maxWidthClasses[maxWidth],
        containerClassName
      )}>
        {children}
      </main>
    </div>
  )
}
