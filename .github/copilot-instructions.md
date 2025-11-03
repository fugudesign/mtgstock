# MTG Stack - AI Agent Instructions

## 🎯 Project Overview

MTG Stack is a French Magic: The Gathering collection management app built with Next.js 15, TypeScript, Prisma, and NextAuth v5. It uses the Scryfall API for card data and supports multi-language card searches.

## 🏗️ Architecture Patterns

### Component Structure

- **`CardDisplay`**: Universal card component with context-aware behavior (`search|collection|deck`)
  - In `search` context: Opens `CardQuickView` modal on click
  - In `collection|deck` context: Shows overlay with actions on hover (desktop only)
- **`CardQuickView`**: Apple-style Quick Look modal for card details in search
  - ResponsiveDialog (Drawer on mobile, Dialog on desktop)
  - 2-column layout desktop (1/3 image, 2/3 info), stacked mobile
  - Price enrichment on-demand with 24h client-side cache
  - Footer with fixed action buttons (scroll content only)
  - Organized in blocks like detail page (badges, legalities, keywords)
- **`CardGrid`**: Shared grid layout for all card displays with loading states and pagination
- **`ItemCard`**: Reusable template for collections/decks with slots for badges, metadata, and actions
- **`CollectionDropdown`**: Reusable dropdown for adding cards to collections
  - Accepts `children` as trigger for customization
  - Fetches collections with card count on open
  - Shows loading state during fetch
- **`DeckDropdown`**: Reusable dropdown for adding cards to decks
  - Accepts `children` as trigger for customization
  - Fetches decks with format and card count on open
  - Shows loading state during fetch
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
- **⚠️ CRITICAL - Migrations**: **NEVER use `npx prisma db push` in development!** Always create proper migrations:
  1. Modify `prisma/schema.prisma`
  2. Run `npx prisma migrate dev --name descriptive_name` to create migration
  3. Commit the migration file to git
  4. **Never skip this step** - `db push` bypasses migrations and causes production deployment failures
- **Foreign Language Support**: Cards store `printed_name`, `printed_type_line`, `printed_text`
- **Price Tracking**:
  - `CollectionCard` and `DeckCard` store `lastPrice` for quick calculations
  - `CardPriceHistory` for historical data and graphs
  - **Client-side price cache**: `src/lib/price-cache.ts` with 24h TTL to avoid repeated API calls
  - Price enrichment done on-demand (detail pages, QuickView, add to collection/deck)

### Scryfall API Integration

- **Service**: `src/lib/scryfall-api.ts` with rate limiting (100ms between requests)
- **Proxy Routes**: `/api/scryfall/*` routes proxy to avoid CORS and add caching
- **Query Building**: Use `buildScryfallQuery()` method for complex searches
- **Language Mapping**: **ALWAYS use `src/lib/language-mapper.ts`** for language code conversions
  - Use `getScryfallCodeByName()` to convert full names (e.g., "French" → "fr")
  - Use `getScryfallCodeByCode()` to convert codes (e.g., "fr" → "fr", "zh" → "zhs")
  - **NEVER create inline language maps** - use the centralized mapper
- **Localization Strategy (PRIORITÉ ABSOLUE)**:
  - ⚠️ **TOUJOURS filtrer par langue** avec `lang:fr` (ou autre langue utilisateur)
  - **Prices NOT shown in search results** for non-English cards (Scryfall limitation)
  - **Price enrichment on-demand only**: use `enrichWithEnglishPrices()` on detail pages or when adding to collection/deck
  - Cards display `printed_name`, `printed_type_line`, `printed_text` in the user's language
  - **Never compromise language for prices** - user experience in native language is top priority
- **Pricing**: Scryfall provides daily updated prices from Cardmarket (EUR) and TCGPlayer (USD) via `card.prices` object (English versions only)

**⚠️ When to use Proxy vs Direct API calls:**

✅ **Use `/api/scryfall/*` proxy routes** (via `mtgApiService`):

- Client Components (`"use client"`) making searches or fetching data
- User-triggered actions (search, autocomplete, filters)
- Repeated or frequent requests that need rate limiting
- Browser-side calls that could face CORS issues

✅ **Use direct Scryfall API** (`https://api.scryfall.com`):

- Server Components loading data on page render
- One-time fetches per page load (no rate limiting risk)
- When you need the absolute latest data without cache
- Server-to-server communication (no CORS issues)

**Example patterns:**

```typescript
// ❌ BAD: Server Component using localhost
const response = await fetch(`http://localhost:3000/api/scryfall/cards/${id}`);

// ✅ GOOD: Server Component using direct API
const response = await fetch(`https://api.scryfall.com/cards/${id}`);

// ✅ GOOD: Client Component using proxy
const card = await mtgApiService.getCardById(id); // Uses /api/scryfall internally
```

### Component Patterns

```tsx
// Always use context prop for different behaviors
<CardDisplay context="search|collection|deck" />
<CardGrid context="search|collection|deck" />

// Conditional rendering based on auth status
const { status } = useSession();
if (status === "authenticated") { /* show actions */ }

// Pagination with load more pattern
<CardGrid
  cards={cards}
  hasMore={hasMore}
  onLoadMore={handleLoadMore}
  pageSize={PAGE_SIZE}
/>
```

### Mobile-First Responsive Design

- **CardDisplay**: Context-aware behavior
  - **Search context**: Click opens `CardQuickView` modal (all devices)
  - **Collection/Deck context**: Desktop hover overlay with actions, mobile tap to navigate
- **CardQuickView**: Apple-style Quick Look
  - **Desktop**: Dialog (max-w-7xl, 90vh), 2-column layout (1/3 image, 2/3 info), footer with 3 buttons in row
  - **Mobile**: Drawer (95vh), stacked layout, footer with 3 buttons stacked
  - **Scroll behavior**: Only content scrolls, header and footer stay fixed
  - **Price enrichment**: On-demand with 24h cache when QuickView opens
- **Responsive Patterns**:
  - Use `useMediaQuery("(min-width: 768px)")` for desktop detection
  - Use `ResponsiveDialog` for adaptive modals (Dialog desktop, Drawer mobile)
  - Footer buttons: `flex-1` only on desktop, natural height on mobile
  - Hidden overlays on mobile with `hidden md:block` pattern

## 🚀 Development Workflow

### Setup Commands

```bash
npm install                           # Install dependencies
npm run dev                          # Start dev server
npm run dev:prisma                   # Start Prisma Studio
npm run dev:all                      # Both dev server and Prisma Studio

# Database migrations (CRITICAL - read carefully!)
npx prisma migrate dev --name <name>  # Create and apply migration (ALWAYS use this)
npx prisma migrate deploy            # Apply migrations in production (auto in Vercel)
npx prisma generate                  # Regenerate client after schema changes
npx prisma studio                    # Open Prisma Studio GUI

# ⚠️ NEVER use these commands:
# npx prisma db push                 # Skips migrations - FORBIDDEN
# npx prisma migrate reset           # Deletes all data - dangerous
```

### Environment Variables

- **Required**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **Optional**: `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`
- **Development**: Use local PostgreSQL or Neon cloud database

## 🎯 **MANDATORY Architecture Patterns** (Updated Nov 2025)

### **ALWAYS use these patterns for ALL pages:**

#### 1. **shadcn/ui Components MAXIMUM Usage**

```tsx
// REQUIRED: Use shadcn components instead of custom ones
- Form, FormField, FormControl, FormItem, FormLabel, FormMessage
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Card, CardHeader, CardContent, CardDescription, CardTitle
- Button, Input, Skeleton
- Dialog, AlertDialog (instead of custom modals)
- Sonner toasts (instead of Alert components)
```

#### 2. **Server Components PRIORITY**

```tsx
// REQUIRED: Load data server-side whenever possible
export default async function PageName() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const data = await prisma.model.findMany({ ... });
  return <PageContent data={data} />;
}
```

#### 3. **loading.tsx Pattern MANDATORY**

```tsx
// REQUIRED: Create loading.tsx in every route directory
export default function Loading() {
  return <Skeleton />; // Use shadcn Skeleton components
}
```

#### 4. **Sonner Notifications ONLY**

```tsx
// REQUIRED: Use Sonner instead of Alert components
import { toast } from "sonner";
toast.success("Success message");
toast.error("Error message");
```

### **Standard Architecture Structure:**

```
/app/[page]/
├── page.tsx          (Server Component - data loading + structure)
├── loading.tsx       (Skeleton - automatic Next.js loading)
└── /components/[page]/
    ├── [Page]Form.tsx    (Client Component - interactivity only)
    └── [Page]Stats.tsx   (Server Component - data display)
```

### Component Creation Guidelines

1. **Server Component by default** - only use `"use client"` when absolutely necessary
2. **Import UI components from `@/components/ui/`** - always prefer shadcn
3. **Use `MTGCard` type from `scryfall-api.ts`** - not custom interfaces
4. **Implement loading with `loading.tsx`** - not inline loading states
5. **Use `auth()` server-side** - not `useSession()` for data fetching
6. **Add Sonner toasts** - not Alert components for notifications

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
- **Class Name Merging**: **ALWAYS use `cn()` utility from `@/lib/utils`** - NEVER use template strings for className

  ```tsx
  // ✅ CORRECT - Use cn() for combining classes
  <div className={cn("base-class", conditionalClass, props.className)} />

  // ❌ WRONG - Never use template strings
  <div className={`base-class ${conditionalClass} ${props.className || ""}`} />
  ```

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
- `src/lib/price-cache.ts` - Client-side price cache with 24h TTL
- `src/lib/language-mapper.ts` - Centralized language code mapping (ALWAYS use this)
- `prisma/schema.prisma` - Database schema with all relationships
- `src/components/cards/CardDisplay.tsx` - Universal card component with context-aware behavior
- `src/components/cards/CardQuickView.tsx` - Apple-style Quick Look modal with price enrichment
- `src/components/cards/CollectionDropdown.tsx` - Reusable dropdown for collections
- `src/components/cards/DeckDropdown.tsx` - Reusable dropdown for decks
- `src/components/ui/responsive-dialog.tsx` - Adaptive Dialog/Drawer with footer support
- `src/app/api/` - API routes for collections, decks, and Scryfall proxy

## 🌐 Internationalization Notes

- **Primary Language**: French UI with English fallbacks
- **Card Data**: Support for multiple languages via Scryfall's `printed_*` fields
- **User Preferences**: `language` field in User model for search preferences
