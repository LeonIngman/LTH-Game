// Utility function to check if a delivery milestone has been missed in the supply chain game.
// Returns true if delivered amount is less than required by the last passed milestone.
export function checkMissedMilestone(
  schedule: { day: number; requiredAmount: number }[] | undefined,
  delivered: number,
  currentDay: number,
): boolean {
  // Safety checks
  if (!schedule || schedule.length === 0 || currentDay <= 0) {
    return false
  }

  // Find the last milestone that has passed
  const passedMilestones = schedule.filter((item) => item.day <= currentDay)
  if (passedMilestones.length === 0) return false

  // Get the cumulative amount from the last passed milestone
  const lastPassedMilestone = passedMilestones[passedMilestones.length - 1]
  const cumulativeAmount = schedule
    .filter((item) => item.day <= lastPassedMilestone.day)
    .reduce((sum, curr) => sum + curr.requiredAmount, 0)

  // Check if we've delivered enough
  return delivered < cumulativeAmount
}
