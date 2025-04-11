export function TableSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* Header */}
      <div className="border-b">
        <div className="grid grid-cols-6 gap-4 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-b">
          <div className="grid grid-cols-6 gap-4 p-4">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 