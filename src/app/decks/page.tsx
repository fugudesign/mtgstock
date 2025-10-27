'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trophy, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

interface Deck {
  id: string
  name: string
  description?: string
  format: string
  cardCount: number
  isPublic: boolean
  createdAt: Date
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([
    // Mock data
    {
      id: '1',
      name: 'Aggro Rouge',
      description: 'Deck aggro rapide avec des créatures rouges',
      format: 'Standard',
      cardCount: 60,
      isPublic: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Contrôle Bleu/Blanc',
      description: 'Deck de contrôle avec contre-sorts et board wipes',
      format: 'Modern',
      cardCount: 75,
      isPublic: true,
      createdAt: new Date(),
    },
  ])

  const [showNewDeckForm, setShowNewDeckForm] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [newDeckFormat, setNewDeckFormat] = useState('casual')

  const formats = [
    'Standard',
    'Modern',
    'Legacy',
    'Vintage',
    'Commander',
    'Pioneer',
    'Pauper',
    'Casual',
  ]

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return

    const newDeck: Deck = {
      id: Date.now().toString(),
      name: newDeckName,
      description: newDeckDescription,
      format: newDeckFormat,
      cardCount: 0,
      isPublic: false,
      createdAt: new Date(),
    }

    setDecks([...decks, newDeck])
    setNewDeckName('')
    setNewDeckDescription('')
    setNewDeckFormat('casual')
    setShowNewDeckForm(false)
  }

  const handleDeleteDeck = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce deck ?')) {
      setDecks(decks.filter(d => d.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Mes Decks
            </h1>
            <p className="text-slate-600">
              Créez et gérez vos decks pour différents formats
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowNewDeckForm(!showNewDeckForm)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nouveau deck
          </Button>
        </div>

        {/* New Deck Form */}
        {showNewDeckForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Créer un nouveau deck</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du deck
                  </label>
                  <Input
                    type="text"
                    placeholder="ex: Mon Deck Elfe"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={newDeckFormat}
                    onChange={(e) => setNewDeckFormat(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                  >
                    {formats.map((format) => (
                      <option key={format} value={format.toLowerCase()}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <Input
                    type="text"
                    placeholder="Description de votre deck..."
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateDeck}>
                    Créer le deck
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewDeckForm(false)
                      setNewDeckName('')
                      setNewDeckDescription('')
                      setNewDeckFormat('casual')
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decks Grid */}
        {decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card
                key={deck.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Trophy className="h-6 w-6 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {deck.name}
                        </CardTitle>
                        {deck.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {deck.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {deck.cardCount} carte{deck.cardCount !== 1 ? 's' : ''}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {deck.format}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {deck.isPublic ? '🌐 Public' : '🔒 Privé'}
                      </span>
                      <span>
                        Créé le {deck.createdAt.toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/decks/${deck.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Trophy className="mr-2 h-4 w-4" />
                          Voir
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Éditer deck:', deck.id)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDeck(deck.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucun deck
              </h3>
              <p className="text-gray-500 mb-6">
                Créez votre premier deck pour commencer à construire vos stratégies
              </p>
              <Button onClick={() => setShowNewDeckForm(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Créer mon premier deck
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}