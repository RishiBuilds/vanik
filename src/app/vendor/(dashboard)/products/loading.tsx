import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-3 h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="mb-5 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border-2 border-line bg-surface">
        <div className="flex gap-3 border-b-2 border-line p-4 sm:px-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="hidden h-10 w-48 sm:block" />
          <Skeleton className="hidden h-10 w-48 sm:block" />
        </div>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b-2 border-line px-5 py-3.5 last:border-0 sm:px-6">
            <Skeleton className="size-11 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
            <Skeleton className="hidden h-4 w-16 md:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
