import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { cn } from "@/lib/utils";

export function TableWrap({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative w-full overflow-x-auto", className)} {...props} />;
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <ShadcnTable className={cn("border-collapse", className)} {...props} />;
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return <TableHeader className={cn("bg-main [&_tr]:hover:bg-main", className)} {...props} />;
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <TableHead
      className={cn("h-10 whitespace-nowrap px-4 font-heading text-xs font-bold uppercase tracking-wide text-main-foreground first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", className)}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <TableBody className={className} {...props} />;
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <TableRow className={cn("border-b-2 border-border hover:bg-muted", className)} {...props} />;
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <TableCell className={cn("px-4 py-3 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", className)} {...props} />;
}
