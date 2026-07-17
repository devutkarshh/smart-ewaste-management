import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  type?: "page" | "card" | "inline"
  className?: string
  children?: ReactNode
}

export function LoadingState({ type = "inline", className, children }: LoadingStateProps) {
  if (type === "page") {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
          {children}
        </div>
      </div>
    )
  }

  if (type === "card") {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
      <span className="text-muted-foreground text-sm">Loading...</span>
      {children}
    </div>
  )
}
