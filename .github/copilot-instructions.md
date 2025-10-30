# MTG Stock - AI Agent Instructions

## 🎯 Project Overview

MTG Stock is a French Magic: The Gathering collection management app built with Next.js 15, TypeScript, Prisma, and NextAuth v5. It uses the Scryfall API for card data and supports multi-language card searches.

## 🏗️ Architecture Patterns

### Component Structure

- **`CardDisplay`**: Universal card component with context-aware behavior (`search|collection|deck`)
- **`CardGrid`**: Shared grid layout for all card displays with loading states and pagination
- **`ItemCard`**: Reusable template for collections/decks with slots for badges, metadata, and actions
- **`ProtectedRoute`**: Client-side wrapper that redirects unauthenticated users to `/auth/login`

### Data Flow

```
Scryfall API → src/lib/scryfall-api.ts → API Routes → Components
Database (Prisma) → API Routes → Components
```

## 🔧 Key Implementation Details

### Authentication (NextAuth v5)

- **Config**: `src/lib/auth.ts` - supports GitHub, Google, and credentials
- **Session Strategy**: JWT with custom callbacks for user ID injection
- **Protection**: Use `<ProtectedRoute>` wrapper for pages requiring auth
- **API Protection**: Use `auth()` from NextAuth for server-side route protection

### Database (Prisma + PostgreSQL)

- **Schema**: Multi-table structure with `User`, `Collection`, `Deck`, `Card`, and junction tables
- **Client**: Import from `src/lib/prisma.ts`, not direct Prisma imports
- **Migrations**: Always run `npx prisma db push` after schema changes
- **Foreign Language Support**: Cards store `printed_name`, `printed_type_line`, `printed_text`

### Scryfall API Integration

- **Service**: `src/lib/scryfall-api.ts` with rate limiting (100ms between requests)
- **Proxy**: `/api/scryfall/*` routes proxy to avoid CORS and add caching
- **Query Building**: Use `buildScryfallQuery()` method for complex searches
- **Localization**: Support French card names via `lang:fr` parameter

### Component Patterns

```tsx
// Always use context prop for different behaviors
<CardDisplay context="search|collection|deck" />
<CardGrid context="search|collection|deck" />

// Conditional rendering based on auth status
const { status } = useSession();
if (status === "authenticated") { /* show actions */ }
```

### Mobile-First Responsive Design

- **CardDisplay**: Simple responsive behavior - click card to navigate on all devices
- **Desktop Pattern**: Hover overlay with all actions visible (hidden on mobile with `hidden md:block`)
- **Mobile Pattern**: Tap card to navigate to details, no overlay actions
- **Implementation**: Use Tailwind responsive classes to hide/show elements

## 🚀 Development Workflow

### Setup Commands

```bash
npm install                    # Install dependencies
npm run dev                   # Start dev server
npm run dev:prisma           # Start Prisma Studio
npm run dev:all              # Both dev server and Prisma Studio
npx prisma db push           # Sync schema changes
npx prisma generate          # Regenerate client after schema changes
```

### Environment Variables

- **Required**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **Optional**: `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`
- **Development**: Use local PostgreSQL or Neon cloud database

### Component Creation Guidelines

1. Use `"use client"` directive for interactive components
2. Import UI components from `@/components/ui/`
3. Use `MTGCard` type from `scryfall-api.ts`, not custom interfaces
4. Implement loading states with skeleton placeholders
5. Add error boundaries and fallback states

### API Route Patterns

```typescript
// Always handle authentication
const session = await auth();
if (!session) return new Response("Unauthorized", { status: 401 });

// Use proper error handling
try {
  // API logic
} catch (error) {
  return NextResponse.json({ error: "Error message" }, { status: 500 });
}
```

## 🎨 Styling Conventions

- **CSS Framework**: Tailwind CSS with custom theme
- **Components**: shadcn/ui components in `src/components/ui/`
- **Card Images**: Use Next.js `Image` component with Scryfall domains whitelisted
- **Responsive**: Mobile-first approach with `md:` breakpoint at 768px
- **Dark/Light**: Theme support via CSS variables
- **Mobile**: Simple tap-to-navigate behavior, no overlay actions
- **Desktop**: Hover overlays with tooltips using `hidden md:block` pattern

## 📱 Page Structure

- **App Router**: All pages in `src/app/` directory
- **Protected Pages**: Wrap with `<ProtectedRoute>` component
- **Loading States**: Use skeleton components while data loads
- **Error Handling**: Show user-friendly error messages with retry options

## 🔍 Key Files to Reference

- `src/lib/scryfall-api.ts` - MTG card data utilities and types
- `src/lib/auth.ts` - Authentication configuration
- `prisma/schema.prisma` - Database schema with all relationships
- `src/components/CardDisplay.tsx` - Card component with all features
- `src/app/api/` - API routes for collections, decks, and Scryfall proxy

## 🌐 Internationalization Notes

- **Primary Language**: French UI with English fallbacks
- **Card Data**: Support for multiple languages via Scryfall's `printed_*` fields
- **User Preferences**: `language` field in User model for search preferences
