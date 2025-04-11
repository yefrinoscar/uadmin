export function EmptyStateSkeleton() {
  return (
    <div className="text-center py-12 animate-pulse">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-64 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="mt-6">
        <div className="h-9 w-32 bg-gray-200 rounded mx-auto" />
      </div>
    </div>
  )
} 