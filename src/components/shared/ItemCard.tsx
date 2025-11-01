"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface ItemCardProps {
  title: string;
  description?: string | null;
  icon: LucideIcon;
  iconColor?: string;
  href: string;
  badges?: ReactNode;
  metadata?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Composant réutilisable pour afficher des cartes (collections, decks, etc.)
 * avec une structure unifiée et des slots personnalisables
 */
export function ItemCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-blue-600",
  href,
  badges,
  metadata,
  onEdit,
  onDelete,
  className,
}: ItemCardProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={cn("h-6 w-6 mt-1", iconColor)} />
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{title}</CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Section badges et métadonnées */}
          {(badges || metadata) && (
            <div className="flex items-center justify-between">
              {badges && <div className="flex gap-2">{badges}</div>}
              {metadata && <div>{metadata}</div>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link href={href} className="flex-1">
              <Button variant="outline" className="w-full">
                Voir
              </Button>
            </Link>
            {onEdit && (
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  <path d="m15 5 4 4" />
                </svg>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
