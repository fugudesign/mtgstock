import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string | null;
  infos?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  infos,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 bg-background p-4 rounded-lg",
        className
      )}
    >
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground mb-0 md:mb-2">
          {title}
        </h1>
        <div className="flex justify-end gap-2">{children}</div>
      </div>
      <div className="flex flex-col gap-4">
        {!!subtitle && (
          <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
        )}
        {!!infos && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">{infos}</div>
          </div>
        )}
      </div>
    </div>
  );
}
