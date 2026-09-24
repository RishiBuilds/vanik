import {
  Card as ShadcnCard,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter as ShadcnCardFooter,
  CardHeader as ShadcnCardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <ShadcnCard className={className} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <ShadcnCardHeader className={cn("border-b-2 border-border", className)}>
      <CardTitle>
        <h2 className="text-base">{title}</h2>
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
      {action && <CardAction>{action}</CardAction>}
    </ShadcnCardHeader>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <CardContent className={className} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <ShadcnCardFooter className={cn("justify-end gap-3 rounded-b-base border-t-2 border-border bg-muted", className)} {...props} />;
}
