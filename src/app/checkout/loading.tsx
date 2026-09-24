import { Skeleton } from "@/components/ui/misc";

export default function CheckoutLoading() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14" aria-busy="true" aria-label="Loading checkout">
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
