# CLAUDE.md - AI Assistant Guide for Stocked Grocery List App

## Project Overview

A smart, shareable grocery list PWA built with Next.js 14. Features AI-powered item categorization, real-time Firebase sync, intelligent repeat purchase suggestions using EWMA algorithm, and Hebrew RTL support.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 18, Shadcn UI, Radix UI, Tailwind CSS 3.4
- **Animations**: Framer Motion, Canvas Confetti
- **Backend**: Firebase Firestore (real-time sync)
- **AI**: OpenAI/OpenRouter for item categorization
- **Testing**: Vitest 4.0, React Testing Library
- **Forms**: React Hook Form + Zod validation

## Project Structure

```
/app                          # Next.js App Router
  ├── page.tsx               # Root redirect to /share/{listId}
  ├── layout.tsx             # Root layout with metadata
  ├── globals.css            # Global styles, CSS variables
  ├── api/categorize/        # OpenAI categorization endpoint
  └── share/[listId]/        # Dynamic shared list page

/components                   # React components
  ├── HomeScreen.tsx         # Main app container (870 LOC)
  ├── CategoryList.tsx       # Categories with items
  ├── GroceryItem.tsx        # Individual item with swipe
  ├── AddItemForm.tsx        # Item addition form
  ├── EditItemModal.tsx      # Item editing modal
  ├── RepeatSuggestions.tsx  # Smart repeat suggestions
  ├── ProgressHeader.tsx     # Progress bar UI
  └── ui/                    # Shadcn component library

/contexts                     # React Context providers
  └── TabViewContext.tsx     # Tab state (grocery/pharmacy)

/hooks                        # Custom React hooks
  ├── use-mobile.tsx         # Mobile detection
  └── use-toast.ts           # Toast notifications

/lib                          # Business logic
  ├── db.ts                  # Firebase Firestore operations
  ├── openrouter.ts          # OpenAI API client
  ├── repeat-suggester.ts    # EWMA purchase prediction (162 LOC)
  ├── firebase.js            # Firebase config
  └── utils.ts               # Utility functions

/types                        # TypeScript definitions
  ├── item.ts                # Item interface
  └── categories.ts          # Category definitions (17 categories)

/tests                        # Test suite (69 tests)
  ├── setup.ts               # Test config and mocks
  ├── components/            # Component tests
  ├── integration/           # User journey tests
  └── lib/                   # Unit tests
```

## Key Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint checks
npm run test         # Run tests once (CI mode)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Architecture Patterns

### State Management
- **TabViewContext**: Tab state (grocery vs pharmacy tabs)
- **Component State**: UI state in HomeScreen (categories, search, modals)
- **Firebase Sync**: Real-time data via `subscribeToList()`
- **Memoization**: `useMemo` for expensive computations, `memo()` for components

### Component Hierarchy
```
HomeScreen
├── ProgressHeader
├── Search Input
├── Tab Navigation (TabViewProvider)
├── CategoryList (memoized)
│   └── GroceryItem (memoized) [many]
├── RepeatSuggestions
├── AddItemForm (lazy loaded)
├── EditItemModal (lazy loaded)
└── ShareButton
```

### Performance Patterns
- Dynamic imports for modals (AddItemForm, EditItemModal, PhotoModal)
- Memoized repeat suggestions computation
- Confetti preloading after mount
- Client-side search filtering

## Code Conventions

### Naming
- Components: PascalCase (`HomeScreen`, `GroceryItem`)
- Functions/variables: camelCase (`handleToggleItem`, `isLoading`)
- Directories: lowercase with dashes (`auth-wizard`)
- Booleans: prefix with `is`, `has`, `should`, `can`

### TypeScript
- Use `interface` over `type`
- Avoid enums; use maps instead
- Functional components with typed props
- Explicit type annotations

### React Patterns
- Functional components with hooks only (no classes)
- Named exports for components
- Early returns in functions
- Callback props for child-to-parent communication

### File Structure
Order within component files:
1. Exported component
2. Subcomponents
3. Helper functions
4. Static content
5. Types

## Testing Guidelines

### Framework Setup
- Vitest with React Testing Library
- JSDOM environment for browser simulation
- Global test utilities enabled
- Auto-cleanup after each test

### Mocks (in `tests/setup.ts`)
- Next.js navigation (`useRouter`, `useParams`)
- Firebase db.ts module
- OpenRouter categorization API

### Test Types
- **Component tests**: Rendering and interactions
- **Integration tests**: Full user workflows
- **Unit tests**: Business logic functions

### Running Tests
```bash
npm run test              # CI mode (single run)
npm run test:watch        # Watch mode (development)
npm run test:coverage     # With coverage report
```

## Key Business Logic

### Repeat Suggestions (`lib/repeat-suggester.ts`)
Uses EWMA (Exponential Weighted Moving Average) algorithm:
- Tracks: interval, variance, decay per item
- Scoring: due date (60%), staple score (35%), regularity (5%)
- Thresholds: MIN_SCORE (0.25), MIN_DUE_SCORE (0.45)
- Returns top 15 suggestions sorted by score

### Item Categorization (`app/api/categorize/route.ts`)
- OpenAI GPT integration for Hebrew item categorization
- 17 predefined categories with emojis
- Fallback to "other" category on errors

### Firebase Operations (`lib/db.ts`)
- `createNewList()`: Create new shopping list
- `getList(listId)`: Fetch list by ID
- `updateList(listId, categories)`: Persist changes
- `subscribeToList(listId, callback)`: Real-time subscription

## Important Notes

### Hebrew/RTL Support
- Full RTL layout via `tailwindcss-rtl` plugin
- Heebo font family for Hebrew text
- All categories have Hebrew translations

### PWA Features
- Dynamic manifest via middleware
- Standalone app mode
- Per-session list ID tracking

### Environment Variables
```
OPENROUTER_API_KEY    # LLM API key for categorization
NEXT_PUBLIC_APP_URL   # Public app URL
```

## Common Development Tasks

### Adding a New Category
1. Update `types/categories.ts` with new category definition
2. Add Hebrew translation and emoji
3. Update categorization prompt in `app/api/categorize/route.ts`

### Adding a New Component
1. Create in `/components` with PascalCase filename
2. Use Shadcn UI primitives from `/components/ui`
3. Add tests in `/tests/components/`

### Modifying Item Structure
1. Update `types/item.ts` interface
2. Update Firebase operations in `lib/db.ts`
3. Update related components (GroceryItem, AddItemForm, etc.)

## Build Configuration

### Next.js (`next.config.mjs`)
- ESLint/TypeScript errors ignored during build
- Experimental parallel compilation enabled
- Image optimization enabled

### Tailwind (`tailwind.config.ts`)
- Shadcn design system colors
- RTL plugin enabled
- Safe area insets for mobile
- Custom animations

## Debugging Tips

- Firebase operations log errors to console
- Toast notifications for user-facing errors
- Check `lib/db.ts` for Firestore error handling
- API route errors logged in `app/api/categorize/route.ts`
