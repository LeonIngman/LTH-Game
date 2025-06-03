import type { Customer, DeliveryScheduleItem } from "@/types/game"

// Helper function to generate delivery schedule based on total requirement and days
export function generateDeliverySchedule(
  totalRequirement: number,
  totalDays: number,
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
