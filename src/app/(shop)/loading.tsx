import { Skeleton } from "@/components/ui/misc";

export default function ShopLoading() {
  return (
    <div className="container-page pt-8 lg:pt-10" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-5 h-11 w-full max-w-md" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-4/5 w-full rounded-lg" />
            <Skeleton className="mt-3 h-3.5 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
