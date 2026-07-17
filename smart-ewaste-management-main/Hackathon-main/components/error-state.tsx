import { ReactNode } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message: string
  type?: "page" | "card" | "inline" | "alert"
  className?: string
  onRetry?: () => void
  children?: ReactNode
}

export function ErrorState({ 
  title = "Something went wrong",
  message, 
  type = "inline", 
  className,
  onRetry,
  children 
}: ErrorStateProps) {
  const content = (
    <>
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-muted-foreground text-sm mt-1">{message}</p>
      {(onRetry || children) && (
        <div className="flex items-center gap-2 mt-3">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try again
            </Button>
          )}
          {children}
        </div>
      )}
    </>
  )

  if (type === "alert") {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">{title}</div>
            <div className="text-sm">{message}</div>
            {(onRetry || children) && (
              <div className="flex items-center gap-2 mt-2">
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {children}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (type === "page") {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px]", className)}>
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {content}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (type === "card") {
    return (
      <Card className={cn("shadow-sm border-destructive/20", className)}>
        <CardContent className="p-4">
          {content}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {content}
    </div>
  )
}
