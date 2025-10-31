"use client";

import { Modal } from "@/components/Modal";
import { ReactNode } from "react";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

/**
 * Modal réutilisable pour les formulaires de création
 * Utilise le composant Modal générique avec le variant "create"
 */
export function CreateModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  className,
}: CreateModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      className={className}
      variant="create"
    >
      {children}
    </Modal>
  );
}
