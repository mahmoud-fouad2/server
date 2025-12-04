import { SkeletonDashboardStats, SkeletonChart } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-10 bg-gray-300 dark:bg-cosmic-800 rounded-lg w-64 mb-4"></div>
          <div className="h-6 bg-gray-200 dark:bg-cosmic-700 rounded w-96"></div>
        </div>
        
        {/* Stats Overview Skeleton */}
        <SkeletonDashboardStats />
        
        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        
        {/* Recent Activity Table Skeleton */}
        <div className="glass-panel p-6 animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-cosmic-700 rounded w-48 mb-6"></div>
          
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-300 dark:bg-cosmic-700 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-cosmic-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-cosmic-700 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-20 bg-gray-300 dark:bg-cosmic-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
