import type { LevelConfig, MapPositions } from "@/types/game"

// Define map positions for Level 3
const level3MapPositions: MapPositions = {
  mainFactory: { x: 500, y: 400 },
  suppliers: {
    1: { x: 50, y: 50, name: "Pink Patty" },
    2: { x: 50, y: 400, name: "Brown Sauce" },
    3: { x: 50, y: 750, name: "Firehouse Foods" },
  },
  restaurants: [
    { x: 950, y: 50, name: "Yummy Zone", customerId: 1 },
    { x: 950, y: 400, name: "Toast-to-go", customerId: 2 },
    { x: 950, y: 750, name: "StudyFuel", customerId: 3 },
  ],
}

/**
 * Level 3 configuration - Uncertainty Unleashed
 */
export const level3Config: LevelConfig = {
  // Existing configuration...

  // Add map positions
  mapPositions: level3MapPositions,
}
