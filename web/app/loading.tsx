export default function Loading() {
  return (
    <div className="min-h-screen flex bg-gray-50 animate-pulse">
      <div className="w-[220px] bg-white border-r border-gray-100 flex-shrink-0" />
      <div className="flex-1 p-8">
        <div className="h-8 w-48 bg-gray-100 rounded-xl mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded-xl mb-8" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28" />
          ))}
        </div>
      </div>
    </div>
  )
}
