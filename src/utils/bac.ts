import { DrinkLog } from "../db/drink";
import { User } from "../db/user";

export function getTimeToBacTarget({
  bacInitial,
  bacTarget = 0.5,
  gender,
}: {
  bacInitial: number;
  bacTarget: number;
  gender: User["gender"];
}): Date | null {
  const eliminationRate = gender === "f" ? 0.1 : 0.15;

  if (bacInitial <= bacTarget) {
    return null;
  }

  const hoursNeeded = (bacInitial - bacTarget) / eliminationRate;
  return new Date(new Date().getTime() + hoursNeeded * 60 * 60 * 1000);
}

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

    const bacAfterElimination = Math.max(0, bacRaw - beta * hoursElapsed);

    totalBAC += bacAfterElimination;
  }

  return totalBAC;
}
