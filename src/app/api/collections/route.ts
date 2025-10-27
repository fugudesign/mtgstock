import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all collections for the current user
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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(collections)
  } catch (error) {
    console.error('Collections fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des collections' },
      { status: 500 }
    )
  }
}

// CREATE a new collection
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const { name, description, isPublic } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom de la collection est requis' },
        { status: 400 }
      )
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic || false,
        userId: user.id
      },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Collection creation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la collection' },
      { status: 500 }
    )
  }
}
