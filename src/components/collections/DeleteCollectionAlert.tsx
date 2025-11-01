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

interface Collection {
  id: string;
  name: string;
  description?: string | null;
}

interface DeleteCollectionAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  collection: Collection | null;
  isDeleting?: boolean;
}

/**
 * Alert Dialog pour confirmer la suppression d'une collection
 * Utilise l'AlertDialog shadcn/ui
 */
export function DeleteCollectionAlert({
  isOpen,
  onClose,
  onConfirm,
  collection,
  isDeleting = false,
}: DeleteCollectionAlertProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la collection</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer la collection{" "}
            <strong>&ldquo;{collection?.name}&rdquo;</strong> ?<br />
            <br />
            Cette action est irréversible et supprimera définitivement toutes les
            cartes associées à cette collection.
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