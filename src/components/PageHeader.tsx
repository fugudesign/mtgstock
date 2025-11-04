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
        "flex flex-col gap-4 p-0 pb-4 md:p-4 rounded-lg",
        className
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-secondary font-heading">
            {title}
          </h1>
          {!!subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          {!!infos && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">{infos}</div>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row justify-end gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
