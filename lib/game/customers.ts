import type { Customer, DeliveryScheduleItem } from "@/types/game"

// Helper function to generate delivery schedule based on total requirement and days
export function generateDeliverySchedule(
  totalRequirement: number,
  totalDays: number,
  minDeliveryAmount = 5,
): DeliveryScheduleItem[] {
  // Validate inputs to prevent NaN errors
  if (totalRequirement <= 0 || totalDays <= 0) {
    console.warn("Invalid inputs for generateDeliverySchedule:", { totalRequirement, totalDays })
    return []
  }

  const schedule: DeliveryScheduleItem[] = []

  // Create exactly 5 milestones at 20%, 40%, 60%, 80%, and 100% of days
  const milestones = [0.2, 0.4, 0.6, 0.8, 1.0]

  let previousAmount = 0

  milestones.forEach((milestone) => {
    // Calculate day for this milestone (ensure it's at least 1)
    const day = Math.max(1, Math.round(totalDays * milestone))

    // Calculate the exact amount that should be delivered by this milestone
    // This is a percentage of the total requirement matching the milestone percentage
    const targetAmount = Math.round(totalRequirement * milestone)

    // Calculate the incremental amount for this specific delivery
    const deliveryAmount = targetAmount - previousAmount

    // Only add if there's something to deliver
    if (deliveryAmount > 0) {
      schedule.push({
        day,
        requiredAmount: deliveryAmount,
      })

      previousAmount = targetAmount
    }
  })

  // Ensure we don't have duplicate days (can happen with rounding)
  const uniqueDaysSchedule: DeliveryScheduleItem[] = []
  const dayMap = new Map<number, number>()

  schedule.forEach((item) => {
    if (dayMap.has(item.day)) {
      // If we already have this day, add to its amount
      dayMap.set(item.day, dayMap.get(item.day)! + item.requiredAmount)
    } else {
      dayMap.set(item.day, item.requiredAmount)
    }
  })

  // Convert back to array
  dayMap.forEach((amount, day) => {
    uniqueDaysSchedule.push({ day, requiredAmount: amount })
  })

  // Sort by day
  return uniqueDaysSchedule.sort((a, b) => a.day - b.day)
}

// Function to create a standard customer with customizable parameters
export function createCustomer(
  id: number,
  name: string,
  description: string,
  leadTime: number,
  totalRequirement: number,
  pricePerUnit: number,
  allowedShipmentSizes: number[],
  transportCosts: Record<number, number>,
  minimumDeliveryAmount = 5,
  daysToComplete = 30,
  active = true,
): Customer {
  return {
    id,
    name,
    description,
    leadTime,
    totalRequirement,
    deliverySchedule: generateDeliverySchedule(totalRequirement, daysToComplete, minimumDeliveryAmount),
    allowedShipmentSizes,
    pricePerUnit,
    transportCosts,
    minimumDeliveryAmount,
    active,
  }
}

// Export standard customers that can be used across different levels
export const standardCustomers = {
  yummyZone: createCustomer(
    1,
    "Yummy Zone",
    "A popular fast food chain with locations across the country.",
    1, // 1 day lead time
    100, // Total requirement of 100 units
    120, // Price per unit: 120 kr
    [5, 10, 20], // Allowed shipment sizes
    { 5: 200, 10: 300, 20: 500 }, // Transport costs
    5, // Minimum delivery amount
  ),

  toastToGo: createCustomer(
    2,
    "Toast-to-go",
    "A trendy breakfast and lunch spot with multiple locations.",
    2, // 2 day lead time
    150, // Total requirement of 150 units
    110, // Price per unit: 110 kr
    [10, 25, 50], // Allowed shipment sizes
    { 10: 250, 25: 450, 50: 700 }, // Transport costs
    10, // Minimum delivery amount
  ),

  studyFuel: createCustomer(
    3,
    "StudyFuel",
    "A campus-based restaurant chain serving university students.",
    3, // 3 day lead time
    200, // Total requirement of 200 units
    100, // Price per unit: 100 kr
    [20, 40, 60], // Allowed shipment sizes
    { 20: 300, 40: 500, 60: 650 }, // Transport costs
    20, // Minimum delivery amount
  ),
}

interface CustomerLevelConfig {
  leadTime: number
  totalRequirement: number
  deliverySchedule?: DeliveryScheduleItem[]
  daysToComplete?: number
}

/**
 * Creates customers with consistent base properties across all levels,
 * but with level-specific lead times, delivery schedules, and total requirements.
 */
export function createCustomers(levelConfigs: CustomerLevelConfig[]): Customer[] {
  // Base customer configurations that remain consistent across all levels
  const baseCustomers = [
    {
      id: 1,
      name: "Yummy Zone",
      description: "A local restaurant chain with specific delivery requirements.",
      pricePerUnit: 49,
      transportCosts: {
        20: 134,
        40: 179,
        100: 204,
      },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 2,
      name: "Toast-to-go",
      description: "A quick-service restaurant requiring regular deliveries.",
      pricePerUnit: 46,
      transportCosts: {
        20: 139,
        40: 186,
        100: 213,
      },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 3,
      name: "StudyFuel",
      description: "A campus food service catering to university students.",
      pricePerUnit: 47,
      transportCosts: {
        20: 145,
        40: 194,
        100: 222,
      },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
  ]

  // Combine base properties with level-specific configurations
  return baseCustomers.map((baseCustomer, index) => {
    const config = levelConfigs[index]

    // Generate delivery schedule if not provided
    const deliverySchedule =
      config.deliverySchedule ||
      generateDeliverySchedule(config.totalRequirement, config.daysToComplete || 30, baseCustomer.minimumDeliveryAmount)

    return {
      ...baseCustomer,
      leadTime: config.leadTime,
      totalRequirement: config.totalRequirement,
      deliverySchedule,
    }
  })
}
