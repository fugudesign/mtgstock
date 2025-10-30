interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-0 md:mb-2">
          {title}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
