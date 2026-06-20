export default function Loading() {
  return (
    <div className="p-4 sm:p-8 animate-pulse">
      <div className="h-7 w-40 sm:h-8 sm:w-48 bg-gray-100 rounded-xl mb-2" />
      <div className="h-4 w-56 sm:w-72 bg-gray-100 rounded-xl mb-6 sm:mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 h-24 sm:h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 h-64 sm:h-80" />
        <div className="bg-white rounded-2xl border border-gray-100 h-64 sm:h-80" />
      </div>
    </div>
  )
}
