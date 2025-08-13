# Onboarding Guide

Welcome to the LTH-Game development team! This guide will get you up and running with the codebase in 30 minutes.

## Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm or pnpm** - Package manager (pnpm recommended)
- **Git** - Version control
- **VS Code** - Recommended IDE with extensions
- **PostgreSQL** - Database (or Neon account)

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss", 
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "ms-vscode.vscode-eslint"
  ]
}
```

## Quick Start (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/GSTHRW/LTH-Game.git
cd LTH-Game

# Install dependencies (use pnpm if available)
npm install
# or
pnpm install

# Copy environment template
cp .env.example .env.local
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Start PostgreSQL service
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# Create database
createdb lth_game_dev

# Run setup script
npm run db:setup
```

#### Option B: Neon Cloud Database (Recommended)
```bash
# Sign up at https://neon.tech
# Create new project
# Copy connection string to .env.local
```

### 3. Environment Configuration
```env
# .env.local
DATABASE_URL=postgresql://user:password@localhost/lth_game_dev
DIRECT_URL=postgresql://user:password@localhost/lth_game_dev
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start Development Server
```bash
npm run dev
# Server starts at http://localhost:3000
```

### 5. Verify Setup
- Navigate to http://localhost:3000
- Create test user: `npm run create-test-user`
- Login with test credentials
- Explore the game interface

## Development Workflow (10 minutes)

### Daily Development Process

1. **Start your day**
```bash
git checkout develop
git pull origin develop
npm install  # If package.json changed
```

2. **Create feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Development cycle**
```bash
# Make changes
# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format

# Commit with conventional commits
git add .
git commit -m "feat(auth): add password validation"
```

4. **Push and create PR**
```bash
git push origin feature/your-feature-name
# Create PR via GitHub interface
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth-utils.test.ts

# Run tests with coverage
npm run test:coverage

# E2E tests (when implemented)
npm run test:e2e
```

### Database Commands

```bash
# Reset database (careful!)
npm run db:reset

# Seed test data
npm run db:seed

# Create test users
npm run create-test-user

# Run database migrations
npm run db:migrate
```

## Project Structure Tour (10 minutes)

### Key Directories

```
LTH-Game/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── auth/             # Auth pages
│   └── dashboard/        # User interfaces
├── components/           # React components
│   ├── ui/              # Reusable components
│   └── auth/            # Auth-specific components
├── lib/                 # Utilities and configs  
├── hooks/               # Custom React hooks
├── tests/               # Test files
└── docs/               # Documentation (you are here!)
```

### Important Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers |
| `middleware.ts` | Request middleware and auth |
| `lib/auth-context.tsx` | Authentication state |
| `lib/db.ts` | Database connection |
| `components.json` | UI component config |
| `tailwind.config.ts` | Styling configuration |

### Component Architecture

```typescript
// Example component structure
export function GameInterface({ levelId }: GameInterfaceProps) {
  // 1. Hooks and state
  const { user } = useAuth()
  const gameState = useGameState(levelId)
  
  // 2. Event handlers
  const handleAction = useCallback(() => {
    // Action logic
  }, [])
  
  // 3. Early returns
  if (!user) return <SignInPrompt />
  
  // 4. Main render
  return (
    <div className="game-interface">
      <GameControls onAction={handleAction} />
      <GameBoard state={gameState} />
    </div>
  )
}
```

## Understanding the Game (5 minutes)

### Game Flow
1. **Student Login** → Dashboard with available levels
2. **Level Selection** → Game interface with objectives
3. **Gameplay** → Make supply chain decisions
4. **Progress Tracking** → Scores and completion status
5. **Teacher View** → Student progress and analytics

### Key Concepts
- **Supply Chain Management**: Students manage inventory, suppliers, customers
- **Forecasting**: Predict demand and plan inventory
- **Decision Making**: Balance cost, quality, and timing
- **Performance Metrics**: Profit, customer satisfaction, efficiency

### Game Levels
- **Level 0**: Tutorial - Basic concepts
- **Level 1**: Simple supply chain
- **Level 2**: Advanced inventory management  
- **Level 3**: Multi-supplier scenarios

## Authentication System (5 minutes)

### How Authentication Works

```mermaid
graph TD
    A[User Login] --> B[API Validation]
    B --> C[Database Check]
    C --> D[Session Creation]
    D --> E[Cookie Setting]
    E --> F[Redirect to Dashboard]
```

### Key Files
- `app/api/auth/login/route.ts` - Login endpoint
- `lib/auth-context.tsx` - React authentication context
- `lib/auth-utils.ts` - Security utilities and error handling
- `middleware.ts` - Route protection

### Test Users
```bash
# Create test users for development
npm run create-test-user

# Default credentials (if using seed data):
# Teacher: leoningman / password123
# Student: leoningman-student / password123
```

## Common Tasks

### Adding a New Component

1. **Create component file**
```typescript
// components/ui/new-component.tsx
interface NewComponentProps {
  title: string
  onClick?: () => void
}

export function NewComponent({ title, onClick }: NewComponentProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
    >
      {title}
    </button>
  )
}
```

2. **Add to exports** (if needed)
```typescript
// components/ui/index.ts
export { NewComponent } from './new-component'
```

3. **Write tests**
```typescript
// tests/unit/new-component.test.tsx
describe('NewComponent', () => {
  it('renders with title', () => {
    render(<NewComponent title="Click me" />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Adding an API Route

1. **Create route file**
```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const data = await sql`SELECT * FROM example_table`
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

2. **Add integration test**
```typescript
// tests/integration/example-api.test.ts
describe('/api/example', () => {
  it('returns example data', async () => {
    const response = await fetch('/api/example')
    const data = await response.json()
    expect(data).toHaveProperty('data')
  })
})
```

### Database Changes

1. **Create SQL migration**
```sql
-- sql/migrations/001_add_example_table.sql
CREATE TABLE example_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Update database**
```bash
npm run db:migrate
```

3. **Update TypeScript types**
```typescript
// types/database.ts
export interface ExampleTable {
  id: number
  name: string
  created_at: Date
}
```

## Debugging Tips

### Common Issues

#### Database Connection Issues
```bash
# Check database status
npm run db:status

# Reset database
npm run db:reset

# Check environment variables
echo $DATABASE_URL
```

#### Authentication Problems
```bash
# Clear browser storage
# Check network tab for API responses
# Verify session cookies are set
```

#### Build/Runtime Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

### Development Tools

#### Browser DevTools
- **Network Tab**: Check API requests/responses
- **Application Tab**: View cookies and localStorage
- **Console**: Check for JavaScript errors
- **React DevTools**: Inspect component state

#### VS Code Features
- **TypeScript IntelliSense**: Hover for type information
- **Go to Definition**: F12 to jump to function definitions
- **Find References**: Shift+F12 to see function usage
- **Integrated Terminal**: Ctrl+` for quick commands

## Learning Resources

### Codebase Documentation
- [Codebase Structure](./CODEBASE_STRUCTURE.md) - Architecture overview
- [Development Guidelines](./DEVELOPMENT_GUIDELINES.md) - Coding standards
- [Project Goals](./PROJECT_GOALS.md) - Strategic direction
- [Troubleshooting](./TROUBLESHOOTING.md) - Common solutions

### Technology Stack
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://radix-ui.com/)

### Testing & Quality
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Getting Help

### Internal Resources
- **Code Reviews**: Ask questions during PR reviews
- **Documentation**: Check docs/ folder first
- **Git History**: `git log --oneline` to see recent changes
- **Tests**: Look at existing tests for examples

### Team Communication
- **Questions**: Tag team members in PR comments
- **Discussions**: Use GitHub Discussions for architecture questions
- **Issues**: Create GitHub issues for bugs or feature requests

### External Resources
- **Stack Overflow**: For general programming questions
- **GitHub Issues**: Check framework/library issue trackers
- **Community Forums**: Next.js Discord, React community

## Next Steps

Now that you're set up, here's what to do next:

1. **Explore the codebase** - Browse components and understand the structure
2. **Run the tests** - See how testing works and contribute test coverage
3. **Pick a small task** - Check [TODO.md](./TODO.md) for beginner-friendly tasks
4. **Make your first PR** - Start with documentation or small fixes
5. **Join team meetings** - Participate in code reviews and planning

Welcome to the team! 🎉

---

*Last updated: August 2025*  
*If you find any issues with this onboarding guide, please update it or let the team know.*
