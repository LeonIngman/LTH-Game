# Insufficient Funds Handling - Implementation Summary

## Changes Made

### 1. API Response Handling (`hooks/use-game-actions.ts`)

**Updated**: `processDay` function to handle insufficient funds responses gracefully:

- ✅ **Safe JSON Parsing**: Added try-catch for JSON parsing with fallback for non-JSON responses
- ✅ **Special Handling for 400 + INSUFFICIENT_FUNDS**: No longer throws for this specific error case
- ✅ **Debouncing**: Prevents spam by tracking `lastInsufficientFundsMessage`
- ✅ **Non-blocking Toast**: Shows toast notification alongside banner
- ✅ **State Management**: Added `insufficientFundsMessage` and `clearInsufficientFundsMessage`

### 2. UI Banner (`components/game/game-interface.tsx`)

**Added**: Insufficient funds banner positioned right before the CostSummary component:

- ✅ **Strategic Placement**: Appears near the action area where users take financial actions
- ✅ **Dismissible**: Users can close the banner with X button
- ✅ **Styled**: Red alert styling to clearly indicate the error
- ✅ **Non-blocking**: Screen remains interactive, game doesn't crash

### 3. TypeScript Types (`types/hooks.ts`)

**Updated**: `GameActionsHook` interface to include:

- ✅ `insufficientFundsMessage: string | null`
- ✅ `clearInsufficientFundsMessage: () => void`

## API Response Format

When insufficient funds occur, the API now returns:

```json
HTTP 400 Bad Request
{
  "code": "INSUFFICIENT_FUNDS",
  "message": "Insufficient funds. Total cost 500.00 kr, available cash 100.00 kr.",
  "details": {
    "totalCost": 500.00,
    "availableCash": 100.00,
    "actions": [...],
    "currency": "kr"
  }
}
```

## User Experience Flow

1. **User attempts expensive action** → Makes API call to `/api/game/process-day`
2. **Server validates affordability** → Returns 400 with `INSUFFICIENT_FUNDS` code
3. **Client parses response safely** → No error thrown, no red overlay
4. **Banner appears** → Shows specific message near action area
5. **Toast notification** → Additional non-blocking feedback
6. **Game remains interactive** → User can adjust actions and try again
7. **Banner dismissible** → User can close banner manually
8. **No spam** → Identical messages are debounced

## Testing

To verify the implementation:

### Manual Testing:

1. Start game at Level 0
2. Set up expensive supplier orders (e.g., 1000+ patties with only 100 kr cash)
3. Click "Next Day" button
4. **Expected**: Banner appears, no red error overlay, game remains usable

### API Testing:

```bash
curl -X POST http://localhost:3000/api/game/process-day \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "levelId": 0,
    "gameState": {"day": 1, "cash": 100, "inventory": {}, "gameOver": false, "history": []},
    "action": {
      "supplierOrders": [{"supplierId": 1, "pattyPurchase": 1000, "cheesePurchase": 0, "bunPurchase": 0, "potatoPurchase": 0}],
      "production": 0,
      "customerOrders": []
    }
  }'
```

**Expected Response**: Status 400 with standardized JSON format, no stack trace.

## Key Benefits

1. **No Application Crashes**: Insufficient funds no longer cause Next.js error overlays
2. **Better UX**: Clear, contextual feedback near the action area
3. **Non-blocking**: Users can immediately adjust their actions
4. **Consistent**: Standardized error format across all insufficient funds scenarios
5. **Spam Prevention**: Debounced messages prevent notification flooding
6. **Graceful Degradation**: Safe JSON parsing handles edge cases

## Files Modified

- `hooks/use-game-actions.ts` - Updated API error handling
- `components/game/game-interface.tsx` - Added insufficient funds banner
- `types/hooks.ts` - Updated TypeScript interfaces
- `app/api/game/process-day/route.ts` - Already standardized in previous work

## Acceptance Criteria Met

✅ Parse JSON safely (fallback if body isn't JSON)
✅ Don't throw on 400 + INSUFFICIENT_FUNDS responses  
✅ Surface message in non-blocking banner near action area
✅ Keep screen mounted and interactive
✅ Prevent repeated clicks from spamming toasts (debounced)
✅ No Next.js red overlay appears
✅ App remains usable after insufficient funds error
