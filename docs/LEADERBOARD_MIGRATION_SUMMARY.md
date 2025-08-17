# Leaderboard Query Migration to Lean Schema

## 🎯 Problem Solved

The leaderboard SQL queries were failing because they referenced the deprecated `TimeStamp` table and `Performance.timestampId` column, which were removed in our lean schema migration.

## ✅ Changes Made

### 1. Updated `getLeaderboard()` Function

**Before**: Complex TimeStamp joins

```sql
-- Old query used:
JOIN "TimeStamp" ts ON p."timestampId" = ts.id
-- And referenced: ts."timestampNumber", p."timestampId"
```

**After**: Direct Performance and GameSession data

```sql
-- New query uses:
p."createdAt" as created_at  -- for Performance temporal ordering
gs.updated_at as created_at  -- for GameSession temporal ordering
gs.game_state::json->>'day' as day_number  -- for day context from GameSession
```

### 2. Updated `getLeaderboardByLevel(levelId)` Function

**Before**: TimeStamp dependencies

```sql
-- Old query included TimeStamp joins and timestampId references
```

**After**: Lean schema approach

```sql
-- Prioritizes most recent data between Performance and GameSession
-- Uses DISTINCT ON (user_id) to get latest record per user
-- Extracts day numbers from GameSession JSON instead of TimeStamp table
```

### 3. Key Architectural Changes

#### Temporal Field Migration ✅

- **Performance.timestampId** → **Performance.createdAt**
- **TimeStamp.timestampNumber** → **GameSession.game_state.day**
- **TimeStamp table joins** → **Direct GameSession JSON extraction**

#### Data Prioritization Logic ✅

```sql
-- New priority system:
1. GameSession data (when available and recent)
2. Performance data (fallback for historical records)
3. User.progress (final fallback)
```

#### Day Number Extraction ✅

```sql
-- Before: ts."timestampNumber" from TimeStamp table
-- After: CAST(gs.game_state::json->>'day' AS INTEGER) from GameSession
```

### 4. Leaderboard Display Fields Maintained ✅

The leaderboard continues to show exactly what was requested:

- **User**: `u.username`
- **Level**: `cd.level_id` (from combined data)
- **Cumulative Profit**: `cd.cumulative_profit` (Performance or GameSession)
- **Day Number**: `gsd.day_number` (from GameSession) or `u.progress` (fallback)
- **Last Active**: `u."lastActive"`

**Sorting**: `ORDER BY level_id ASC, cumulative_profit DESC, lastActive DESC` ✅

### 5. Profit Handling Enhancement ✅

```sql
-- Handles both integer (öre) and decimal (krona) formats:
CASE
  WHEN gs.game_state::json->>'cumulativeProfit' ~ '^-?\d+$'
  THEN CAST(gs.game_state::json->>'cumulativeProfit' AS INTEGER)
  ELSE CAST(ROUND(CAST(gs.game_state::json->>'cumulativeProfit' AS NUMERIC) * 100) AS INTEGER)
END
```

## 🔄 Data Flow Comparison

### Before (Complex Chain)

```
Performance → timestampId → TimeStamp → timestampNumber (day)
                        ↘ marketDemand, prices
```

### After (Direct Access)

```
Performance → createdAt (temporal ordering)
GameSession → game_state.day (day number)
           ↘ game_state.cumulativeProfit (profit)
```

## 📊 Benefits Achieved

### 1. Performance Improvements ✅

- **Reduced Joins**: No more complex TimeStamp table joins
- **Direct Data Access**: GameSession JSON extraction is efficient
- **Faster Queries**: Simpler query execution plans

### 2. Data Accuracy ✅

- **Latest Data Priority**: GameSession data overrides stale Performance data
- **Temporal Consistency**: Uses actual creation/update timestamps
- **Flexible Profit Handling**: Supports both öre and krona formats

### 3. Schema Alignment ✅

- **Lean Architecture**: Aligned with 11-table schema
- **No Deprecated References**: All TimeStamp dependencies removed
- **Future-Proof**: Clean foundation for continued development

## 🧪 Verification Status

### Database Queries ✅

- **Performance table**: Confirmed `createdAt` available and working
- **GameSession table**: Confirmed JSON data extraction working
- **Combined Logic**: Tested priority system works correctly

### TypeScript Compilation ✅

- **No Syntax Errors**: All functions compile successfully
- **Type Safety**: Maintained throughout refactoring

### Test Updates ✅

- **leaderboard-database.test.ts**: Updated to remove TimeStamp references
- **leaderboard-troubleshooting.test.ts**: Already updated in previous session

## 🎉 Mission Accomplished

The leaderboard queries now work correctly with the lean schema and provide:

✅ **Accurate Data**: Latest GameSession data prioritized over stale Performance data  
✅ **Performance**: Simplified queries with direct data access  
✅ **Compatibility**: Maintains all expected leaderboard fields and sorting  
✅ **Future-Ready**: Clean architecture aligned with lean schema principles

**The leaderboard is now fully functional with the streamlined 11-table database schema.**
