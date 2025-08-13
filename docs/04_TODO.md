# Project To-Do List

## Pending Tasks

### Core Features

- Overstock costs
- Integrate player progress with the database so that it is stored for post-round analysis  
  _(store only one game session per level — do this last)_
- Fix tutorial _(last for UI work)_
- Implement safety stock (visual only)
- Centralize more values (e.g., level names appear in multiple places)
- Implement quizzes
- Per-player/team-member quiz tracking _(maybe postpone)_
- Implement most/all icons from the suggested UI _(maybe postpone/cancel)_
- Ensure all numbers are correct _(game-testing)_
- Make tables downloadable or add a button for the player to copy the full table into Excel
- Forecasting should block production outside of the forecasting phase
- Orders should appear immediately in the **Current Orders** widget when placed
- Show ETA when purchasing and ETD when selling

### Testing & Debugging

- Game test level-by-level; take notes and debug:
  - purchasing
  - holding cost
  - inventory
  - _(etc.)_

### UI & UX

- Show objectives pop-up upon entering a level, before forecasting
- Make quizzes non-repeatable until the teacher fails or passes them
- Display player name per quiz run
- Make production instant in level 0 _(double-check requirements)_
- Implement all desired performance metrics

### Infrastructure & Cleanup

- _(Optional)_ Migrate to LTH server
- Remove unused/bloat code:
  - daily demand
  - express delivery / deliveryOption
  - GameState attributes _(verify if needed)_
  - `inventoryTransactions: InventoryTransaction[]`
  - `finishedGoodsBatches: FinishedGoodsBatch[]`
  - `productionCapacity`
- Centralize calculations _(optional)_:
  - Move all calculations to `inventory-management/sale-calculations/purchase-calculations`
  - Import them into their respective hook files
  - **Alternatively**: move all calculations into the hook files and import hooks into `game-interface` instead of defining new functions
- Merge `MaterialOrder` and `SupplierOrder`

---

## Completed Tasks

- Added customer and supplier information directly on the level page
- Moved **Today’s Actions** below the map; moved customer/supplier info to the left of the map  
  (made information in **Today’s Orders** less spacious)
- Added transportation cost and profit to the cost summary widget
- Handled "Maximum production: 20 meals" in the production window _(check if hardcoded)_
- Changed descriptions, level names, etc.
- Updated delivery schedule for customers (fixed mismatch with Excel and overdue issue from day zero)
- Implemented forecasting for level 2 and 3
- Added forecasting tools
- Warned player that nothing is saved when clicking **Exit Game**
- Replaced inventory line plot with bar graph
- Always display transport costs in supplier/customer menu; adjusted total cost/profit display
- Added **Reset Day** button
- Added place order/sell order options for customers/suppliers
- Replaced **Game History** with **Today’s Actions**
- Implemented lateness penalty
- Replaced **Market Information** widget with pending orders list
- Updated UI for daily holding cost calculation explanation
- Updated daily capacity for suppliers (total capacity over game duration)
- Removed buns from overstock threshold
- Implemented variable lead times for level 3
