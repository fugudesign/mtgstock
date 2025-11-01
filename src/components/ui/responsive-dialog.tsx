"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks";
import { ReactNode } from "react";

interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Dialog responsive qui s'affiche :
 * - Comme un Drawer sur mobile (xs, sm)
 * - Comme un Dialog sur desktop (md+)
 */
export function ResponsiveDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Ne pas rendre si la modal n'est pas ouverte
  if (!isOpen) return null;

  return (
    <div suppressHydrationWarning>
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className={className}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
            {children}
            {footer && <DialogFooter>{footer}</DialogFooter>}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className={className}>
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </DrawerHeader>
            <div className="px-4">{children}</div>
            {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

/**
 * Hook utilitaire pour créer facilement des boutons de fermeture
 */
export function useResponsiveDialogClose() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const CloseButton = ({
    children,
    ...props
  }: React.ComponentProps<typeof Button>) => {
    if (isDesktop) {
      return <Button {...props}>{children}</Button>;
    }
    return (
      <DrawerClose asChild>
        <Button {...props}>{children}</Button>
      </DrawerClose>
    );
  };

  return { CloseButton, isDesktop };
}
