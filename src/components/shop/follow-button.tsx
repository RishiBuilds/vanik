"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { toggleFollow } from "@/lib/actions/social";
import { Button, type ButtonProps } from "@/components/ui/button";

export function FollowButton({
  storeId,
  storeName,
  initial,
  size = "sm",
  variant,
  className,
}: {
  storeId: string;
  storeName: string;
  initial: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [following, setFollowing] = useOptimistic(initial);
  const [, start] = useTransition();
  return (
    <Button
      size={size}
      variant={variant ?? (following ? "outline" : "primary")}
      className={className}
      aria-pressed={following}
      onClick={() =>
        start(async () => {
          setFollowing(!following);
          const res = await toggleFollow(storeId);
          if (!res.ok) {
            if (res.error === "auth")
              toast("Sign in to follow shops", {
                action: { label: "Sign in", onClick: () => router.push(`/sign-in?next=${encodeURIComponent(pathname)}`) },
              });
            else toast.error(res.error);
            return;
          }
          toast.success(res.data?.following ? `Following ${storeName}` : `Unfollowed ${storeName}`);
          router.refresh();
        })
      }
    >
      {following ? <Check /> : <Plus />} {following ? "Following" : "Follow"}
    </Button>
  );
}
