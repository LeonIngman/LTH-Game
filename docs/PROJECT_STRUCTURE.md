# Project Overview and Codebase Structure

## Project Purpose

This project is a web-based educational simulation game focused on supply chain management. It allows students and teachers to interact with a simulated supply chain, make decisions, and observe the outcomes. The game includes quizzes, dashboards, and analytics to support learning objectives in logistics and operations management.

## Codebase Structure

- **app/**: Main Next.js application directory. Contains routes, API endpoints, global styles, and layout components.
  - `api/`: Serverless API routes for authentication, game logic, etc.
  - `auth/`, `dashboard/`, `game/`, `quiz/`: Route groups for authentication, dashboards, game levels, and quizzes.
  - `env.ts`, `globals.css`, `layout.tsx`, `page.tsx`: App-wide configuration, styles, and layout.
- **components/**: Reusable React components, organized by feature (theme, auth, dashboard, game, performance, quiz, ui).
- **hooks/**: Custom React hooks for state management and business logic (e.g., game state, customer/supplier orders).
- **lib/**: Library code for authentication, database access, utility functions, and game logic (e.g., game engine, level configs).
- **prisma/**: Prisma ORM schema for database modeling.
- **public/**: Static assets (images, logos, placeholders).
- **scripts/**: Node.js scripts for database setup, seeding, and testing.
- **sql/**: Raw SQL files for database schema and migrations.
- **styles/**: Additional global CSS (may duplicate `app/globals.css`).
- **types/**: TypeScript type definitions for components, game logic, hooks, and authentication.
- **utils/**: Utility functions (e.g., milestone checking).

### Why This Structure?

- **Separation of concerns**: Features and logic are grouped for clarity and maintainability.
- **Scalability**: Modular organization supports adding new features (levels, quizzes, analytics) without clutter.
- **Next.js conventions**: Uses the app directory and API routes for modern full-stack development.

## Redundant or Unnecessary Code

- **Duplicate global styles**: Both `app/globals.css` and `styles/globals.css` define similar Tailwind and CSS variables. Consider consolidating into one file to avoid confusion.
- **Unused or overly verbose comments**: Some files (e.g., quiz components) have commented-out code or placeholder comments. Clean up for clarity.

## Areas Missing Structure or Documentation

- **Inline documentation**: Many functions (especially in `lib/game/engine.ts`, API routes, and custom hooks) lack comments explaining their purpose and logic.
- **Component props**: Some components do not document their expected props or usage.
- **Scripts**: While `scripts/README.md` is helpful, individual scripts could use more inline comments.

## Recommendations for Improved Understanding

### 1. Consolidate Global Styles

- Merge `app/globals.css` and `styles/globals.css` to a single source of truth.

### 2. Add Inline Comments to Key Logic

- Add concise comments to functions in `lib/game/engine.ts`, API routes, and custom hooks.
- Example added below for `utils/checkMissedMilestone.ts`:

```ts
// Returns true if the delivered amount is less than required by the last passed milestone
export function checkMissedMilestone(
  schedule: { day: number; requiredAmount: number }[] | undefined,
  delivered: number,
  currentDay: number
): boolean {
  // Safety checks
  if (!schedule || schedule.length === 0 || currentDay <= 0) {
    return false;
  }

  // Find the last milestone that has passed
  const passedMilestones = schedule.filter((item) => item.day <= currentDay);
  if (passedMilestones.length === 0) return false;

  // Get the cumulative amount from the last passed milestone
  const lastPassedMilestone = passedMilestones[passedMilestones.length - 1];
  const cumulativeAmount = schedule
    .filter((item) => item.day <= lastPassedMilestone.day)
    .reduce((sum, curr) => sum + curr.requiredAmount, 0);

  // Check if we've delivered enough
  return delivered < cumulativeAmount;
}
```

### 3. Document Component Props

- Add JSDoc or TypeScript comments to all exported components and hooks.

### 4. Clean Up Redundant Files

- Remove or merge duplicate CSS files.
- Remove commented-out or placeholder code.

---

**This document is intended as a starting point for onboarding and future cleanup.**
