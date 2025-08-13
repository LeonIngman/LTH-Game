# Troubleshooting Guide

This document contains solutions to common issues encountered during development and deployment of LTH-Game.

## Table of Contents

1. [Development Environment](#development-environment)
2. [Database Issues](#database-issues)
3. [Authentication Problems](#authentication-problems)
4. [Game Functionality](#game-functionality)
5. [UI/UX Issues](#uiux-issues)
6. [Performance Problems](#performance-problems)
7. [Testing Issues](#testing-issues)
8. [Deployment Problems](#deployment-problems)

---

## Development Environment

### Node.js and Package Management

#### ❌ **Problem**: `npm ERR! peer dep missing` errors
**Symptoms**: Installation fails with peer dependency warnings
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall with exact versions
npm install --exact

# Or use pnpm which handles peer deps better
npm install -g pnpm
pnpm install
```

#### ❌ **Problem**: TypeScript compilation errors after update
**Symptoms**: `Property does not exist on type` errors
**Solution**:
```bash
# Check TypeScript version compatibility
npm list typescript

# Restart TypeScript server in VS Code
# Command Palette → TypeScript: Restart TS Server

# Clear TypeScript cache
rm -rf .next/types
npx tsc --build --clean

# Check tsconfig.json for strict mode issues
```

#### ❌ **Problem**: Hot reload not working
**Symptoms**: Changes don't reflect in browser, need manual refresh
**Solution**:
```bash
# Check if running on correct port
lsof -i :3000

# Kill conflicting processes
pkill -f "next dev"

# Restart dev server
npm run dev

# Check firewall/antivirus blocking websockets
# Disable any proxy servers temporarily
```

### VS Code Setup Issues

#### ❌ **Problem**: Extensions not working properly
**Symptoms**: No IntelliSense, formatting not working
**Solution**:
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## Database Issues

### Connection Problems

#### ❌ **Problem**: `Connection refused` to PostgreSQL
**Symptoms**: Database queries fail, connection timeout errors
**Solution**:
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo service postgresql status        # Linux

# Start PostgreSQL service
brew services start postgresql        # macOS
sudo service postgresql start         # Linux

# Check connection string format
# postgresql://username:password@host:port/database

# Test connection manually
psql $DATABASE_URL
```

#### ❌ **Problem**: `relation does not exist` errors
**Symptoms**: SQL queries fail with table not found
**Solution**:
```bash
# Check if tables exist
npm run db:status

# Run database setup script
npm run db:setup

# Check for case sensitivity issues (PostgreSQL is case-sensitive)
# Use lowercase table names or quotes: "User" vs user
```

#### ❌ **Problem**: Neon database connection timeout
**Symptoms**: Slow queries, connection drops in production
**Solution**:
```javascript
// lib/db.ts - Add connection pooling
const sql = neon(process.env.DATABASE_URL!, {
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  maxConnections: 20
})
```

### Migration Issues

#### ❌ **Problem**: Schema drift between environments
**Symptoms**: Database inconsistencies between dev/prod
**Solution**:
```bash
# Export current schema
pg_dump --schema-only $DATABASE_URL > schema.sql

# Compare with expected schema
diff schema.sql sql/schema.sql

# Run migrations in order
npm run db:migrate

# Backup before major changes
pg_dump $DATABASE_URL > backup.sql
```

---

## Authentication Problems

### Login Issues

#### ❌ **Problem**: "Invalid credentials" for correct password
**Symptoms**: Login fails despite correct username/password
**Solution**:
```bash
# Check password hashing consistency
# Bcrypt rounds should match between creation and verification

# Verify user exists in database
npm run db:query "SELECT username, password FROM \"User\" WHERE username = 'your-username'"

# Check for extra whitespace or encoding issues
# Trim inputs in API route
```

#### ❌ **Problem**: Session cookies not persisting
**Symptoms**: User gets logged out on page refresh
**Solution**:
```javascript
// app/api/auth/login/route.ts
cookieStore.set("auth_session", sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // False in development
  sameSite: "lax", // Not "strict" for development
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/"
})

// Check browser dev tools → Application → Cookies
```

#### ❌ **Problem**: CORS issues with authentication
**Symptoms**: Auth requests fail with CORS errors
**Solution**:
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
        ]
      }
    ]
  }
}
```

### Permission Issues

#### ❌ **Problem**: Middleware blocking legitimate requests
**Symptoms**: Authenticated users can't access protected routes
**Solution**:
```javascript
// middleware.ts - Debug session validation
export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('auth_session')
  console.log('Session cookie:', sessionCookie) // Debug line
  
  // Check session validation logic
  // Ensure database query is correct
}
```

---

## Game Functionality

### Game State Issues

#### ❌ **Problem**: Game progress not saving
**Symptoms**: Student progress resets on page refresh
**Solution**:
```javascript
// hooks/use-game-state.ts
useEffect(() => {
  // Auto-save game state periodically
  const saveInterval = setInterval(() => {
    if (gameState.hasChanges) {
      saveGameState(gameState)
    }
  }, 30000) // Every 30 seconds

  return () => clearInterval(saveInterval)
}, [gameState])
```

#### ❌ **Problem**: Inventory calculations incorrect
**Symptoms**: Numbers don't add up, negative inventory
**Solution**:
```javascript
// lib/game/engine.ts - Add validation
function updateInventory(current: number, change: number): number {
  const result = current + change
  if (result < 0) {
    console.warn(`Inventory would go negative: ${current} + ${change} = ${result}`)
    return 0 // Or throw error based on game rules
  }
  return result
}
```

#### ❌ **Problem**: Game freezes during complex calculations
**Symptoms**: UI becomes unresponsive, browser tab crashes
**Solution**:
```javascript
// Use Web Workers for heavy calculations
// lib/game/worker.ts
self.onmessage = function(e) {
  const { gameState, action } = e.data
  const result = performComplexCalculation(gameState, action)
  self.postMessage(result)
}

// In component
const worker = new Worker('/game-worker.js')
worker.postMessage({ gameState, action })
worker.onmessage = (e) => {
  setGameState(e.data)
}
```

### Level Progression Issues

#### ❌ **Problem**: Students can't advance to next level
**Symptoms**: Next level button disabled despite completion
**Solution**:
```javascript
// Check completion criteria
const isLevelComplete = useMemo(() => {
  return gameState.objectives.every(objective => 
    objective.completed && objective.score >= objective.requiredScore
  )
}, [gameState.objectives])

// Debug completion status
console.log('Objectives status:', gameState.objectives)
console.log('Level complete:', isLevelComplete)
```

---

## UI/UX Issues

### Styling Problems

#### ❌ **Problem**: Tailwind classes not applying
**Symptoms**: Styling doesn't work, classes appear in DOM but no effects
**Solution**:
```bash
# Check if Tailwind CSS is properly imported
# app/globals.css should have:
@tailwind base;
@tailwind components;
@tailwind utilities;

# Clear Next.js cache
rm -rf .next

# Check for conflicting CSS
# Use browser dev tools to see computed styles
# Check for CSS specificity issues
```

#### ❌ **Problem**: Dark mode not switching correctly
**Symptoms**: Some components stay light/dark when switching
**Solution**:
```javascript
// components/theme-provider.tsx
useEffect(() => {
  // Force re-render of all components
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}, [theme])

// Check CSS selectors use .dark: prefix correctly
// bg-white dark:bg-gray-900
```

### Accessibility Issues

#### ❌ **Problem**: Screen reader not announcing errors
**Symptoms**: Error messages not accessible to assistive technology
**Solution**:
```javascript
// Ensure proper ARIA attributes
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="error-message"
>
  {errorMessage}
</div>

// Check with screen reader testing
// Use axe-core browser extension
```

#### ❌ **Problem**: Keyboard navigation broken
**Symptoms**: Can't tab through form elements, focus indicators missing
**Solution**:
```css
/* Add focus indicators */
.focus\:ring-2:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Check tab order */
/* Use tabindex appropriately (0 for default, -1 to remove from tab order) */
```

---

## Performance Problems

### Slow Loading

#### ❌ **Problem**: Large bundle size causing slow initial load
**Symptoms**: Long white screen, slow First Contentful Paint
**Solution**:
```bash
# Analyze bundle size
npm run build
npm run start

# Check bundle analyzer
npm install --save-dev @next/bundle-analyzer

# next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

#### ❌ **Problem**: Database queries taking too long
**Symptoms**: API responses > 1 second, UI freezing during data loads
**Solution**:
```javascript
// Add query logging
console.time('user-query')
const users = await sql`SELECT * FROM "User" WHERE role = 'student'`
console.timeEnd('user-query')

// Add database indexes
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_session_expires ON "Session"(expires_at);

// Use LIMIT for large datasets
const recentUsers = await sql`
  SELECT * FROM "User" 
  WHERE "lastActive" > NOW() - INTERVAL '30 days'
  ORDER BY "lastActive" DESC 
  LIMIT 100
`
```

### Memory Issues

#### ❌ **Problem**: Memory leaks in React components
**Symptoms**: Browser memory usage keeps increasing
**Solution**:
```javascript
// Clean up useEffect properly
useEffect(() => {
  const interval = setInterval(() => {
    // Some periodic task
  }, 1000)

  // Always clean up!
  return () => clearInterval(interval)
}, [])

// Remove event listeners
useEffect(() => {
  const handleResize = () => { /* ... */ }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

---

## Testing Issues

### Test Failures

#### ❌ **Problem**: Tests failing in CI but passing locally
**Symptoms**: GitHub Actions tests fail, local tests pass
**Solution**:
```bash
# Check Node.js versions match
node --version  # Local
# Compare with .github/workflows/test.yml

# Check for environment differences
# Use same test database setup
# Clear test data between runs

# Run tests in same environment as CI
docker run -it --rm -v $(pwd):/app node:18 bash
cd /app && npm test
```

#### ❌ **Problem**: Flaky tests that sometimes pass/fail
**Symptoms**: Intermittent test failures, timing issues
**Solution**:
```javascript
// Use waitFor for async operations
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
}, { timeout: 5000 })

// Mock timers for consistent testing
jest.useFakeTimers()
// ... test code
jest.runAllTimers()
jest.useRealTimers()
```

### Mock Issues

#### ❌ **Problem**: Database mocking not working in tests
**Symptoms**: Tests try to connect to real database
**Solution**:
```javascript
// jest.setup.js
jest.mock('@/lib/db', () => ({
  sql: jest.fn().mockImplementation((strings, ...values) => {
    // Return mock data based on query
    if (strings[0].includes('SELECT * FROM "User"')) {
      return Promise.resolve([{ id: 1, username: 'test' }])
    }
    return Promise.resolve([])
  })
}))
```

---

## Deployment Problems

### Vercel Deployment Issues

#### ❌ **Problem**: Build failing on Vercel
**Symptoms**: Deployment fails with TypeScript or dependency errors
**Solution**:
```bash
# Check build locally first
npm run build

# Verify environment variables in Vercel dashboard
# DATABASE_URL, NEXTAUTH_SECRET, etc.

# Check Vercel function limits
# 50MB unzipped, 250MB zipped size limit
# Consider code splitting for large bundles
```

#### ❌ **Problem**: Database connection timeouts in production
**Symptoms**: 500 errors in production, database connection issues
**Solution**:
```javascript
// Increase connection timeout for production
const sql = neon(process.env.DATABASE_URL!, {
  connectionTimeoutMillis: 10000, // 10 seconds
  queryTimeoutMillis: 30000,      // 30 seconds
})

// Add retry logic
async function queryWithRetry(queryFn: () => Promise<any>, retries = 3) {
  try {
    return await queryFn()
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return queryWithRetry(queryFn, retries - 1)
    }
    throw error
  }
}
```

### Environment Variables

#### ❌ **Problem**: Environment variables not working in production
**Symptoms**: Undefined environment variables, config errors
**Solution**:
```javascript
// next.config.mjs - Expose client-side variables
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Or use NEXT_PUBLIC_ prefix for client-side access
}

// Validate environment variables
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})
```

---

## General Debugging Strategies

### Systematic Debugging Approach

1. **Identify the scope** - Is it frontend, backend, database, or deployment?
2. **Reproduce consistently** - Can you make it happen every time?
3. **Check the logs** - Browser console, server logs, database logs
4. **Isolate the issue** - Remove complexity until you find the root cause
5. **Test the fix** - Ensure your solution doesn't break something else

### Useful Debugging Tools

#### Browser DevTools
```javascript
// Add breakpoints in code
debugger;

// Log with context
console.log('User data:', { user, timestamp: new Date() })

// Network tab: Check request/response details
// Application tab: Inspect cookies, localStorage, sessionStorage
// Performance tab: Find bottlenecks
```

#### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### When to Ask for Help

- You've spent more than 2 hours on the same issue
- The problem affects critical functionality
- You need architectural guidance
- You're unsure about security implications

### How to Ask for Help Effectively

1. **Provide context** - What were you trying to do?
2. **Show what you tried** - Include attempted solutions
3. **Include error messages** - Full stack traces, not just summaries
4. **Minimal reproduction** - Create the smallest possible example
5. **Environment details** - OS, Node version, browser, etc.

## Related Documentation

- [Development Guidelines](./DEVELOPMENT_GUIDELINES.md) - Best practices and workflows
- [Codebase Structure](./CODEBASE_STRUCTURE.md) - Understanding the architecture  
- [Onboarding](./ONBOARDING.md) - Getting started guide
- [Project Goals](./PROJECT_GOALS.md) - Strategic context
- [TODO](./TODO.md) - Known issues and planned improvements

---

*Last updated: August 2025*  
*If you encounter an issue not covered here, please add it after resolving it.*
