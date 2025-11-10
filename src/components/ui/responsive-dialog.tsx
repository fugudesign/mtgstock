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
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";

interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  desktopClassName?: string; // Classes spécifiques desktop (Dialog)
  mobileClassName?: string; // Classes spécifiques mobile (Drawer)
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
  desktopClassName,
  mobileClassName,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isMounted, setIsMounted] = useState(false);

  // Attendre que le composant soit monté côté client pour éviter le flash
  useEffect(() => {
    // Utiliser un micro-délai pour éviter le flash d'animation
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Ne pas rendre si la modal n'est pas ouverte OU si pas encore monté
  if (!isOpen || !isMounted) return null;

  return (
    <>
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className={cn(className, desktopClassName)}>
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
          <DrawerContent
            className={cn("flex flex-col", className, mobileClassName)}
          >
            <DrawerHeader className="text-left shrink-0">
              <DrawerTitle>{title}</DrawerTitle>
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </DrawerHeader>
            <div className="px-4 pb-8 overflow-y-auto flex-1 min-h-0">
              {children}
            </div>
            {footer && (
              <DrawerFooter className="pt-2 pb-8 shrink-0">
                {footer}
              </DrawerFooter>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </>
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
