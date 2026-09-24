"use client";

import { Tabs as ShadcnTabs, TabsContent as ShadcnTabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { cn } from "@/lib/utils";

export const Tabs = ShadcnTabs;
export { TabsList, TabsTrigger };

export function TabsContent({ className, ...props }: React.ComponentProps<typeof ShadcnTabsContent>) {
  return <ShadcnTabsContent className={cn("pt-6 data-[state=active]:animate-fade-in", className)} {...props} />;
}
