import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/decks - Récupérer tous les decks de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const decks = await prisma.deck.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { cards: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer le nombre total de cartes pour chaque deck
    const decksWithCardCount = await Promise.all(
      decks.map(async (deck) => {
        const cards = await prisma.deckCard.findMany({
          where: { deckId: deck.id }
        })
        const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0)
        
        return {
          ...deck,
          cardCount: totalCards
        }
      })
    )

    return NextResponse.json(decksWithCardCount)
  } catch (error) {
    console.error('Error fetching decks:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/decks - Créer un nouveau deck
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, format } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom du deck est requis' }, { status: 400 })
    }

    const deck = await prisma.deck.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        format: format || 'casual',
        userId: user.id,
      },
    })

    return NextResponse.json(deck, { status: 201 })
  } catch (error) {
    console.error('Error creating deck:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
