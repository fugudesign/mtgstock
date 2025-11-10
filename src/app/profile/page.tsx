import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileStats } from "@/components/profile/ProfileStats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Globe, User } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // Authentification côté serveur
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Chargement des données utilisateur côté serveur
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      language: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          collections: true,
          decks: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <Container className="max-w-3xl">
      <PageHeader title="Mon profil" />

      <div className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-primary" />
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
                  value={user.email}
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
              <Globe className="text-primary" />
              Préférences
            </CardTitle>
            <CardDescription>Personnalisez votre expérience</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialData={{
                name: user.name,
                image: user.image,
                language: user.language,
                email: user.email,
              }}
            />
          </CardContent>
        </Card>

        {/* Stats Card */}
        <ProfileStats
          stats={{
            collections: user._count.collections,
            decks: user._count.decks,
          }}
        />
      </div>
    </Container>
  );
}
