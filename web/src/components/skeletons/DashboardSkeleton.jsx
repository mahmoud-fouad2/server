export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-cosmic-950" dir="rtl">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-72 flex-col gap-4 p-6 border-l border-gray-200/70 dark:border-white/10 bg-white/95 dark:bg-cosmic-900/80 backdrop-blur-xl">
        <div className="h-10 w-36 bg-gray-200 dark:bg-cosmic-800 rounded-lg animate-pulse mb-6" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-11 w-full rounded-xl bg-gray-200 dark:bg-cosmic-800 animate-pulse"
          />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="glass-panel flex justify-between items-center mb-8 p-5 rounded-xl">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-cosmic-800 animate-pulse" />
            <div className="h-4 w-64 rounded bg-gray-200 dark:bg-cosmic-800 animate-pulse" />
          </div>
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-cosmic-800 animate-pulse" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-cosmic-800 animate-pulse" />
          ))}
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-xl bg-gray-200 dark:bg-cosmic-800 animate-pulse" />
          <div className="h-96 rounded-xl bg-gray-200 dark:bg-cosmic-800 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
