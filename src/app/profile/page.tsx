"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAvailableLanguagesByCode } from "@/lib/language-mapper";
import { Globe, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Mapper local pour les labels natifs (optionnel, on peut utiliser les noms anglais aussi)
const getLanguageDisplayName = (code: string): string => {
  const nativeNames: { [key: string]: string } = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    pt: "Português",
    ja: "日本語",
    ko: "한국어",
    ru: "Русский",
    zh: "中文",
    zht: "繁體中文",
  };
  return nativeNames[code] || code;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    language: "en",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      // Fetch user profile
      fetchUserProfile();
    }
  }, [status, session, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || "",
          language: data.language || "en",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Erreur lors de la mise à jour",
        });
        setSaving(false);
        return;
      }

      setMessage({ type: "success", text: "Profil mis à jour avec succès" });
      setSaving(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Erreur lors de la mise à jour" });
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen mx-auto p-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">Mon profil</h1>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du compte
              </CardTitle>
              <CardDescription>
                Gérez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    L&apos;email ne peut pas être modifié
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Préférences
              </CardTitle>
              <CardDescription>Personnalisez votre expérience</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      message.type === "success"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Nom
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Langue par défaut
                  </label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {getAvailableLanguagesByCode().map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {getLanguageDisplayName(lang.value)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cette langue sera utilisée par défaut pour vos recherches de
                    cartes
                  </p>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats Card (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>Votre activité sur Magic Stack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">
                    Collections
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Decks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Cartes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
