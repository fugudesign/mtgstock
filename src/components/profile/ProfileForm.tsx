"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvatarUrl } from "@/lib/avatar";
import { getAvailableLanguagesByCode } from "@/lib/language-mapper";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Trash2, Upload, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Schema de validation pour le profil
const profileSchema = z.object({
  name: z.string().optional(),
  image: z.string().url("URL invalide").optional().or(z.literal("")),
  language: z.string().min(1, "La langue est requise"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: {
    name?: string | null;
    image?: string | null;
    language?: string | null;
    email: string;
  };
}

// Fonction pour détecter la langue du navigateur
const getBrowserLanguage = (): string => {
  if (typeof window === "undefined") return "en";

  const browserLang = navigator.language.split("-")[0]; // "fr-FR" -> "fr"
  const availableLanguages = getAvailableLanguagesByCode();

  // Vérifier si la langue du navigateur est supportée
  const isSupported = availableLanguages.some(
    (lang) => lang.value === browserLang
  );
  return isSupported ? browserLang : "en";
};

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name || "",
      image: initialData.image || "",
      language: initialData.language || getBrowserLanguage(),
    },
  });

  const imageValue = useWatch({ control: form.control, name: "image" });

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation côté client
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux. Maximum 5MB");
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type
      )
    ) {
      toast.error(
        "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF"
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de l'upload");
        return;
      }

      // Mettre à jour le formulaire avec la nouvelle URL
      form.setValue("image", data.user.image);
      toast.success("Avatar mis à jour avec succès");

      // Rafraîchir la session pour mettre à jour l'avatar dans la navbar
      await update();
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      // Reset le input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!imageValue) return;

    try {
      const response = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la suppression");
        return;
      }

      form.setValue("image", "");
      toast.success("Avatar supprimé avec succès");

      // Rafraîchir la session pour mettre à jour l'avatar dans la navbar
      await update();
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        toast.error(responseData.error || "Erreur lors de la mise à jour");
        return;
      }

      toast.success("Profil mis à jour avec succès");

      // Rafraîchir la session pour mettre à jour le nom dans la navbar
      await update();
      router.refresh(); // Rafraîchir les données server-side
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Aperçu de l'avatar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage
                src={getAvatarUrl(imageValue || null, initialData.email, 160)}
                alt={initialData.name || "User"}
              />
              <AvatarFallback className="bg-primary">
                <User className="size-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Photo de profil</p>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload />
                  {uploading ? "Upload..." : "Télécharger"}
                </Button>
                {imageValue && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="iconSm"
                    onClick={handleAvatarDelete}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WebP ou GIF. Max 5MB.
                {!imageValue && " Gravatar par défaut."}
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Langue par défaut</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getAvailableLanguagesByCode().map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Cette langue sera utilisée par défaut pour vos recherches de
                cartes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            <Save />
            {form.formState.isSubmitting
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
