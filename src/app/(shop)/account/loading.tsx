import { Skeleton } from "@/components/ui/misc";

export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-10 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
