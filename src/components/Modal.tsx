"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
  variant?: "create" | "edit" | "delete";
}

/**
 * Modal réutilisable pour les formulaires et actions
 * Gère l'overlay, l'animation, et les actions communes
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  className,
  variant = "create",
}: ModalProps) {
  // Label par défaut selon le variant
  const defaultSubmitLabel = {
    create: "Créer",
    edit: "Modifier",
    delete: "Supprimer",
  }[variant];

  const finalSubmitLabel = submitLabel || defaultSubmitLabel;

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Style du bouton selon le variant
  const submitButtonVariant = variant === "delete" ? "destructive" : "default";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <Card className={cn("w-full max-w-lg mx-4 relative", className)}>
        <CardHeader className="relative">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {children}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                variant={submitButtonVariant}
              >
                {isSubmitting ? "Traitement..." : finalSubmitLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
