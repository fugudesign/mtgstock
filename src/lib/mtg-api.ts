import axios from 'axios'

const MTG_API_BASE = process.env.MTG_API_BASE_URL || 'https://api.magicthegathering.io/v1'

// Types for MTG API responses
export interface MTGCard {
  id: string
  name: string
  names?: string[]
  manaCost?: string
  cmc?: number
  colors?: string[]
  colorIdentity?: string[]
  type?: string
  supertypes?: string[]
  types?: string[]
  subtypes?: string[]
  rarity?: string
  set?: string
  setName?: string
  text?: string
  flavor?: string
  artist?: string
  number?: string
  power?: string
  toughness?: string
  loyalty?: string
  multiverseid?: number
  variations?: number[]
  imageUrl?: string
  watermark?: string
  border?: string
  timeshifted?: boolean
  hand?: number
  life?: number
  reserved?: boolean
  releaseDate?: string
  starter?: boolean
  rulings?: Array<{
    date: string
    text: string
  }>
  foreignNames?: Array<{
    name: string
    language: string
    multiverseid?: number
  }>
  printings?: string[]
  originalText?: string
  originalType?: string
  legalities?: Array<{
    format: string
    legality: string
  }>
  source?: string
  layout?: string
}

export interface MTGSet {
  code: string
  name: string
  type: string
  border: string
  mkm_id?: number
  mkm_name?: string
  releaseDate: string
  magicCardsInfoCode?: string
  block?: string
  onlineOnly?: boolean
  booster?: unknown[]
}

export interface MTGApiResponse<T> {
  cards?: T[]
  card?: T
  sets?: MTGSet[]
  set?: MTGSet
}

export interface CardSearchParams {
  name?: string
  layout?: string
  cmc?: number | string
  colors?: string
  colorIdentity?: string
  type?: string
  supertypes?: string
  types?: string
  subtypes?: string
  rarity?: string
  set?: string
  setName?: string
  text?: string
  flavor?: string
  artist?: string
  number?: string
  power?: string
  toughness?: string
  loyalty?: string
  language?: string
  gameFormat?: string
  legality?: string
  page?: number
  pageSize?: number
  orderBy?: string
  random?: boolean
  contains?: string
  id?: string
  multiverseid?: number
}

class MTGApiService {
  private baseUrl: string
  private requestCount: number = 0
  private lastRequestTime: number = Date.now()

  constructor() {
    this.baseUrl = MTG_API_BASE
  }

  // Rate limiting helper (5000 requests per hour = ~1.4 per second)
  private async throttle() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < 750) { // Wait at least 750ms between requests
      await new Promise(resolve => setTimeout(resolve, 750 - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  private buildQueryString(params: CardSearchParams): string {
    const validParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&')
    
    return validParams ? `?${validParams}` : ''
  }

  async searchCards(params: CardSearchParams): Promise<{ cards: MTGCard[], hasMore: boolean, total?: number }> {
    await this.throttle()
    
    try {
      const queryString = this.buildQueryString(params)
      const response = await axios.get(`${this.baseUrl}/cards${queryString}`)
      
      const cards = response.data.cards || []
      const totalCount = parseInt(response.headers['total-count'] || '0')
      const pageSize = parseInt(response.headers['page-size'] || '100')
      const currentPage = params.page || 1
      
      return {
        cards,
        hasMore: totalCount > (currentPage * pageSize),
        total: totalCount
      }
    } catch (error) {
      console.error('Error searching cards:', error)
      throw new Error('Failed to search cards')
    }
  }

  async getCardById(id: string): Promise<MTGCard | null> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/cards/${id}`)
      return response.data.card || null
    } catch (error) {
      console.error('Error getting card by ID:', error)
      return null
    }
  }

  async getCardByMultiverseId(multiverseId: number): Promise<MTGCard | null> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/cards/${multiverseId}`)
      return response.data.card || null
    } catch (error) {
      console.error('Error getting card by multiverse ID:', error)
      return null
    }
  }

  async getRandomCards(count: number = 10): Promise<MTGCard[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/cards?random=true&pageSize=${Math.min(count, 100)}`)
      return response.data.cards || []
    } catch (error) {
      console.error('Error getting random cards:', error)
      return []
    }
  }

  async getAllSets(): Promise<MTGSet[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/sets`)
      return response.data.sets || []
    } catch (error) {
      console.error('Error getting sets:', error)
      return []
    }
  }

  async getSetByCode(setCode: string): Promise<MTGSet | null> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/sets/${setCode}`)
      return response.data.set || null
    } catch (error) {
      console.error('Error getting set by code:', error)
      return null
    }
  }

  async generateBoosterPack(setCode: string): Promise<MTGCard[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/sets/${setCode}/booster`)
      return response.data.cards || []
    } catch (error) {
      console.error('Error generating booster pack:', error)
      return []
    }
  }

  async getTypes(): Promise<string[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/types`)
      return response.data.types || []
    } catch (error) {
      console.error('Error getting types:', error)
      return []
    }
  }

  async getSubtypes(): Promise<string[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/subtypes`)
      return response.data.subtypes || []
    } catch (error) {
      console.error('Error getting subtypes:', error)
      return []
    }
  }

  async getSupertypes(): Promise<string[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/supertypes`)
      return response.data.supertypes || []
    } catch (error) {
      console.error('Error getting supertypes:', error)
      return []
    }
  }

  async getFormats(): Promise<string[]> {
    await this.throttle()
    
    try {
      const response = await axios.get(`${this.baseUrl}/formats`)
      return response.data.formats || []
    } catch (error) {
      console.error('Error getting formats:', error)
      return []
    }
  }

  // Helper method to search cards by foreign name
  async searchCardsByForeignName(name: string, language: string): Promise<MTGCard[]> {
    return (await this.searchCards({ name, language })).cards
  }

  // Helper method to search cards by exact name
  async searchCardsByExactName(name: string): Promise<MTGCard[]> {
    return (await this.searchCards({ name: `"${name}"` })).cards
  }

  // Helper method to search cards with filters suitable for French users
  async searchCardsForLanguage(query: string, language: string = 'french', page: number = 1): Promise<{ cards: MTGCard[], hasMore: boolean, total?: number }> {
    // First try to search by foreign name
    const foreignResults = await this.searchCards({
      name: query,
      language: language,
      page,
      pageSize: 20
    })

    // If no results with foreign name, try regular search
    if (foreignResults.cards.length === 0) {
      return await this.searchCards({
        name: query,
        page,
        pageSize: 20
      })
    }

    return foreignResults
  }
}

// Singleton instance
export const mtgApiService = new MTGApiService()

// Utility functions for card data
export const getCardImageUrl = (card: MTGCard): string => {
  return card.imageUrl || '/placeholder-card.png'
}

export const formatManaCost = (manaCost?: string): string => {
  if (!manaCost) return ''
  return manaCost.replace(/[{}]/g, '')
}

export const getCardColors = (card: MTGCard): string[] => {
  return card.colors || []
}

export const isCardLegal = (card: MTGCard, format: string): boolean => {
  if (!card.legalities) return false
  const legality = card.legalities.find(l => l.format.toLowerCase() === format.toLowerCase())
  return legality?.legality.toLowerCase() === 'legal'
}

export const getCardForeignName = (card: MTGCard, language: string): string => {
  if (!card.foreignNames) return card.name
  const foreignName = card.foreignNames.find(fn => fn.language.toLowerCase().includes(language.toLowerCase()))
  return foreignName?.name || card.name
}