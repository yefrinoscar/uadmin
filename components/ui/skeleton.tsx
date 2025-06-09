import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "shimmer" | "pulse"
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === "shimmer" ? "shimmer" : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

// Utility skeleton components for common patterns
function SkeletonText({ 
  lines = 1, 
  className,
  ...props 
}: { lines?: number } & React.ComponentProps<typeof Skeleton>) {
  if (lines === 1) {
    return <Skeleton className={cn("h-4 w-full", className)} {...props} />
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full",
            className
          )} 
          {...props} 
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ 
  size = "md",
  className,
  ...props 
}: { size?: "sm" | "md" | "lg" } & React.ComponentProps<typeof Skeleton>) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  }
  
  return (
    <Skeleton 
      className={cn("rounded-full", sizeClasses[size], className)} 
      {...props} 
    />
  )
}

function SkeletonButton({ 
  size = "md",
  className,
  ...props 
}: { size?: "sm" | "md" | "lg" } & React.ComponentProps<typeof Skeleton>) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32"
  }
  
  return (
    <Skeleton 
      className={cn("rounded-md", sizeClasses[size], className)} 
      {...props} 
    />
  )
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton }
