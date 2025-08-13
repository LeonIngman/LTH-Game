# Development Guidelines

## Code Standards

### TypeScript Standards

#### Type Definitions

```typescript
// ✅ Good: Explicit interfaces for props
interface SignInFormProps {
  onSuccess?: (user: User) => void
  redirectPath?: string
  className?: string
}

// ❌ Bad: Using any
function handleSubmit(data: any) { }

// ✅ Good: Proper typing
function handleSubmit(data: FormData) { }
```

#### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `SignInForm`, `GameInterface` |
| **Functions** | camelCase | `validateInput`, `calculateScore` |
| **Constants** | UPPER_SNAKE_CASE | `AUTH_COOKIE_NAME`, `MAX_RETRY_ATTEMPTS` |
| **Files** | kebab-case | `sign-in-form.tsx`, `auth-utils.ts` |
| **Types/Interfaces** | PascalCase | `User`, `AuthError`, `GameState` |
| **Enums** | PascalCase | `AuthErrorType`, `GameLevel` |

#### File Organization

```typescript
// File structure within components
import { /* external imports */ } from 'library'
import { /* internal imports */ } from '@/lib/utils'

// Types and interfaces
interface ComponentProps { }
type ComponentState = { }

// Component implementation
export function ComponentName(props: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  
  // Event handlers
  const handleClick = () => { }
  
  // Render
  return <div>...</div>
}
```

### React Standards

#### Component Structure

```typescript
// ✅ Good: Functional components with proper hooks
export function GameInterface({ levelId }: GameInterfaceProps) {
  const { user, loading } = useAuth()
  const gameState = useGameState(levelId)
  
  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />
  if (!user) return <Redirect to="/auth/signin" />
  
  return (
    <div className="game-interface">
      {/* Component JSX */}
    </div>
  )
}

// ❌ Bad: Class components (avoid unless necessary)
class GameInterface extends React.Component { }
```

#### Hooks Guidelines

```typescript
// ✅ Good: Custom hooks for shared logic
function useGameActions(levelId: string) {
  const [actions, setActions] = useState<GameAction[]>([])
  
  const addAction = useCallback((action: GameAction) => {
    setActions(prev => [...prev, action])
  }, [])
  
  return { actions, addAction }
}

// ✅ Good: Dependencies array for useEffect
useEffect(() => {
  fetchUserData(userId)
}, [userId]) // Include all dependencies

// ❌ Bad: Missing dependencies
useEffect(() => {
  fetchUserData(userId)
}, []) // Missing userId dependency
```

### Accessibility Standards

#### WCAG AA Compliance

```typescript
// ✅ Good: Proper ARIA attributes
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>

// ✅ Good: Error announcements
<div
  role="alert"
  aria-live="assertive"
  className="text-red-800 dark:text-red-200"
>
  {errorMessage}
</div>

// ✅ Good: Form labels and descriptions
<label htmlFor="username" className="block text-sm font-medium">
  Username
</label>
<input
  id="username"
  name="username"
  aria-describedby={error ? "username-error" : undefined}
/>
{error && (
  <p id="username-error" role="alert">
    {error.message}
  </p>
)}
```

#### Color Contrast Requirements

```css
/* ✅ Good: WCAG AA compliant colors */
.error-text {
  @apply text-red-800 dark:text-red-200; /* 4.5:1 contrast ratio */
}

.success-text {
  @apply text-green-800 dark:text-green-200;
}

/* ❌ Bad: Low contrast */
.error-text {
  @apply text-red-300; /* Insufficient contrast */
}
```

### CSS/Styling Standards

#### Tailwind Usage

```typescript
// ✅ Good: Semantic class grouping
<div className="
  flex items-center justify-between
  p-4 rounded-lg border
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
">

// ✅ Good: Responsive design
<div className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-4 md:gap-6
">

// ✅ Good: Component variants with clsx
import { clsx } from 'clsx'

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
}

<button className={clsx(
  'px-4 py-2 rounded font-medium transition-colors',
  buttonVariants[variant],
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

## Testing Standards

### Test Structure

```typescript
// ✅ Good: Descriptive test organization
describe('SignInForm', () => {
  describe('when user enters valid credentials', () => {
    it('should call onSuccess with user data', async () => {
      // Arrange
      const onSuccess = jest.fn()
      render(<SignInForm onSuccess={onSuccess} />)
      
      // Act
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      // Assert
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'testuser' })
      )
    })
  })
  
  describe('accessibility', () => {
    it('should announce errors to screen readers', async () => {
      render(<SignInForm />)
      
      // Submit invalid form
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      // Check for alert role
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
```

### Testing Priorities

1. **Happy Path**: Test the primary user workflows
2. **Error Handling**: Test validation and error states  
3. **Accessibility**: Test keyboard navigation and screen readers
4. **Edge Cases**: Test boundary conditions and unusual inputs
5. **Integration**: Test component interactions and API calls

## Commit Message Format

### Conventional Commits

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring without feature changes |
| `test` | Adding or modifying tests |
| `chore` | Build process, dependencies, etc. |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |

#### Scopes

| Scope | Usage |
|-------|-------|
| `auth` | Authentication system |
| `game` | Game mechanics and interface |
| `ui` | User interface components |
| `api` | API routes and endpoints |
| `db` | Database schema or queries |
| `a11y` | Accessibility improvements |
| `security` | Security enhancements |
| `test` | Testing infrastructure |

#### Examples

```bash
# ✅ Good commit messages
feat(auth): add accessible error feedback to login form
fix(game): resolve inventory calculation bug
docs: update API documentation for authentication
refactor(ui): extract reusable button component
test(auth): add integration tests for login flow

# ❌ Bad commit messages
"fixed stuff"
"updates"
"WIP"
"quick fix"
```

#### Commit Body Format

```
feat(auth): add two-factor authentication

Enhanced security with TOTP-based 2FA:
• lib/auth-utils.ts → TOTP generation → secure token creation
• components/auth/two-factor.tsx → 2FA UI → accessible input form
• app/api/auth/verify-2fa → validation endpoint → token verification
• tests/integration/2fa.test.ts → comprehensive tests → security validation

Resolves: #123
Breaking Change: Users must enable 2FA for teacher accounts
```

## Branching Strategy

### Git Flow Adaptation

```
main (production)
├── develop (integration)
├── feature/auth-improvements
├── feature/game-level-3
├── hotfix/critical-security-patch
└── release/v1.2.0
```

#### Branch Types

| Type | Purpose | Base | Merge To |
|------|---------|------|----------|
| `main` | Production code | - | - |
| `develop` | Integration branch | `main` | `main` |
| `feature/` | New features | `develop` | `develop` |
| `hotfix/` | Critical fixes | `main` | `main` & `develop` |
| `release/` | Release preparation | `develop` | `main` & `develop` |

#### Branch Naming

```bash
# ✅ Good branch names
feature/accessible-error-handling
feature/game-level-progression
fix/login-validation-bug
hotfix/security-vulnerability
release/v1.2.0

# ❌ Bad branch names
my-branch
temp
fix
updates
```

## Code Review Process

### Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

#### Code Quality
- [ ] Follows naming conventions
- [ ] TypeScript types are correct
- [ ] No unused imports or variables
- [ ] Functions are reasonably sized

#### Accessibility
- [ ] ARIA attributes are correct
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatibility

#### Testing
- [ ] Tests cover new functionality
- [ ] Tests are meaningful and well-named
- [ ] Test coverage is adequate
- [ ] No flaky or brittle tests

#### Security
- [ ] Input validation is present
- [ ] No secrets in code
- [ ] Authentication is properly handled
- [ ] SQL injection prevention

### Review Guidelines

#### For Authors

1. **Self-review first** - Review your own PR before requesting review
2. **Small PRs** - Keep changes focused and reviewable
3. **Clear description** - Explain what, why, and how
4. **Tests included** - Add appropriate test coverage
5. **Documentation updated** - Update relevant docs

#### For Reviewers

1. **Be constructive** - Suggest improvements, don't just criticize
2. **Ask questions** - Understand the reasoning behind changes
3. **Test locally** - For significant changes, test the functionality
4. **Focus on important issues** - Don't nitpick minor style issues
5. **Approve or request changes** - Be clear about the review status

### Review Comments

```bash
# ✅ Good review comments
"Consider extracting this logic into a custom hook for reusability"
"This could cause a race condition - should we add a loading state?"
"Great accessibility improvements! The ARIA labels are perfect"
"Can we add a test case for the error scenario?"

# ❌ Bad review comments
"This is wrong"
"Fix this"
"I don't like this approach"
"Style issue"
```

## Development Workflow

### Daily Development

1. **Pull latest**: `git pull origin develop`
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Development cycle**:
   - Write failing test (TDD approach)
   - Implement feature
   - Make test pass
   - Refactor if needed
4. **Commit regularly** with conventional commits
5. **Push and create PR** when feature is complete

### Code Formatting

#### Automatic Formatting

```bash
# Run before committing
npm run lint          # ESLint
npm run lint:fix      # Auto-fix linting issues
npm run format        # Prettier
npm run type-check    # TypeScript validation
```

#### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json}": ["prettier --write"]
  }
}
```

## Related Documentation

- [Codebase Structure](./CODEBASE_STRUCTURE.md) - Architecture and organization
- [Project Goals](./PROJECT_GOALS.md) - Objectives and success criteria
- [Onboarding](./ONBOARDING.md) - Getting started guide
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [TODO](./TODO.md) - Pending tasks and improvements

---

*Last updated: August 2025*  
*These guidelines evolve with the project - suggest improvements via PR.*
