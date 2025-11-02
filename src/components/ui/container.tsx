import { cn } from "@/lib/utils";

interface ContainerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto max-w-8xl w-full px-4 pb-24 md:pb-4", className)}
    >
      {children}
    </div>
  );
}
