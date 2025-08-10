import { DrinkLog } from "../services/drink";
import { User } from "../services/user";

export function getEstimateBACFromLogs(
  drinks: DrinkLog[],
  user: User,
  currentDate: Date = new Date()
): number | null {
  if (!user.weight) return null;

  const r = user.gender === "f" ? 0.6 : 0.7;
  const beta = 0.15;
  const alcoholDensity = 0.789;

  let totalBAC = 0;

  for (const drink of drinks) {
    const consumedAt = new Date(drink.consumed_at);
    const hoursElapsed = Math.max(
      0,
      (currentDate.getTime() - consumedAt.getTime()) / 3600000
    );

    const alcoholGrams =
      drink.volume_ml *
      (parseFloat(drink.alcohol_percentage) / 100) *
      alcoholDensity;

    const bacRaw = alcoholGrams / (r * user.weight);
    const bacAfterElimination = bacRaw - beta * hoursElapsed;

    if (bacAfterElimination > 0) {
      totalBAC += bacAfterElimination;
    }
  }

  return totalBAC;
}
