import { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  labelClassName?: string
}

export function FormField({
  label,
  description,
  error,
  required,
  children,
  className,
  labelClassName
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface FormLayoutProps {
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  columns?: 1 | 2
}

export function FormLayout({
  title,
  description,
  children,
  footer,
  className,
  columns = 1
}: FormLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      <div className={cn(
        "space-y-6",
        columns === 2 && "grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0"
      )}>
        {children}
      </div>
      
      {footer && (
        <div className="border-t pt-6">
          {footer}
        </div>
      )}
    </div>
  )
}
