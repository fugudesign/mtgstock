import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

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
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { name, language } = await req.json()

    // Validate language
    const validLanguages = ['en', 'fr', 'de', 'es', 'it', 'pt', 'ja', 'ko', 'ru', 'zh']
    if (language && !validLanguages.includes(language)) {
      return NextResponse.json(
        { error: 'Langue invalide' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name }),
        ...(language && { language }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        language: true,
        image: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      message: 'Profil mis à jour',
      user
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
