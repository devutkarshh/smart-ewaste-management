import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PageCardProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  headerClassName?: string
  contentClassName?: string
  footer?: ReactNode
}

export function PageCard({
  children,
  title,
  description,
  className,
  headerClassName,
  contentClassName,
  footer
}: PageCardProps) {
  return (
    <Card className={cn("shadow-sm border-border/50", className)}>
      {(title || description) && (
        <CardHeader className={cn("space-y-2", headerClassName)}>
          {title && (
            <CardTitle className="text-xl font-semibold text-foreground">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-4", contentClassName)}>
        {children}
      </CardContent>
      
      {footer && (
        <div className="border-t border-border/50 p-6 pt-4">
          {footer}
        </div>
      )}
    </Card>
  )
}
