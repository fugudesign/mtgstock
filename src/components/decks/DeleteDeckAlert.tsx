"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Deck {
  id: string;
  name: string;
  description?: string | null;
}

interface DeleteDeckAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deck: Deck | null;
  isDeleting?: boolean;
}

/**
 * Alert Dialog pour confirmer la suppression d'un deck
 * Utilise l'AlertDialog shadcn/ui
 */
export function DeleteDeckAlert({
  isOpen,
  onClose,
  onConfirm,
  deck,
  isDeleting = false,
}: DeleteDeckAlertProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le deck</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le deck{" "}
            <strong>&ldquo;{deck?.name}&rdquo;</strong> ?<br />
            <br />
            Cette action est irréversible et supprimera définitivement toutes
            les cartes associées à ce deck.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
