import { Skeleton } from "@/components/ui/misc";

export default function VendorLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-10 w-80 max-w-full" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
