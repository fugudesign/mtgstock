import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validation du type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF",
        },
        { status: 400 }
      );
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 5MB" },
        { status: 400 }
      );
    }

    // Récupérer l'ancien avatar pour le supprimer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, image: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'ancien avatar s'il existe et qu'il est sur Vercel Blob
    if (user.image && user.image.includes("vercel-storage.com")) {
      try {
        await del(user.image);
      } catch (error) {
        console.error("Error deleting old avatar:", error);
        // Continue même si la suppression échoue
      }
    }

    // Upload du nouveau fichier
    const blob = await put(
      `avatars/${user.id}-${Date.now()}.${file.type.split("/")[1]}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      }
    );

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: blob.url },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json({
      message: "Avatar mis à jour",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { image: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le fichier sur Vercel Blob s'il existe
    if (user.image && user.image.includes("vercel-storage.com")) {
      try {
        await del(user.image);
      } catch (error) {
        console.error("Error deleting avatar:", error);
      }
    }

    // Retirer l'avatar de la base de données
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: null },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json({
      message: "Avatar supprimé",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'avatar" },
      { status: 500 }
    );
  }
}
