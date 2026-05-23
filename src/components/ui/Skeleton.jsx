export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-gradient-to-r from-gold/5 via-gold/20 to-gold/5 bg-[length:200%_100%] ${className}`}
      aria-hidden
    />
  )
}

export function PhotoGridSkeleton({ count = 8 }) {
  const aspects = ['aspect-[3/4]', 'aspect-[4/3]', 'aspect-square', 'aspect-[3/4]']
  return (
    <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={`mb-4 w-full break-inside-avoid sm:mb-5 ${aspects[i % aspects.length]}`}
        />
      ))}
    </div>
  )
}

export function AlbumGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-gold/10 bg-dark/40"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 border-t border-gold/10 p-4 sm:p-5">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
