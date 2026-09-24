import { BrowseSkeleton } from "@/components/browse/browse-view";

export default function Loading() {
  return (
    <div className="container-page pb-8 pt-8 lg:pt-10">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="mb-8 mt-5 h-11 w-72 rounded bg-muted" />
      <BrowseSkeleton />
    </div>
  );
}
