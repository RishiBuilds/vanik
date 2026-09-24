import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading inventory">
      <div className="mb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-26 rounded-xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border-2 border-line bg-surface">
        <div className="border-b-2 border-line p-4 sm:px-6">
          <Skeleton className="h-10 w-full" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b-2 border-line px-5 py-3 last:border-0 sm:px-6">
            <Skeleton className="size-10 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
