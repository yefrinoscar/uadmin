export function ProformaSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow animate-pulse">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between">
          {/* Company Info */}
          <div className="space-y-3">
            <div className="h-8 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-60 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
          {/* Proforma Number */}
          <div className="text-right space-y-3">
            <div className="h-6 w-32 bg-gray-200 rounded ml-auto" />
            <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="p-6 border-b space-y-3">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>

      {/* Items Table */}
      <div className="p-6 border-b">
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b">
            <div className="col-span-1">
              <div className="h-4 w-8 bg-gray-200 rounded" />
            </div>
            <div className="col-span-5">
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>

          {/* Table Rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b">
              <div className="col-span-1">
                <div className="h-4 w-6 bg-gray-200 rounded" />
              </div>
              <div className="col-span-5">
                <div className="h-4 w-full bg-gray-200 rounded" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="p-6">
        <div className="ml-auto w-64 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
} 