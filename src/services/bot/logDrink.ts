import { addDrinkLog } from "../../db/drink";
import { User } from "../../db/user";

type Drink = {
  drinkType: string;
  quantity: number;
  percentage: number;
  date: string;
};

export const logDrink = async ({
  drinks,
  user,
}: {
  drinks: Drink[];
  user: User;
}) => {
  return Promise.all(
    drinks.map((drink) =>
      addDrinkLog({
        user_id: user.id,
        drink_type: drink.drinkType,
        volume_ml: drink.quantity * 10,
        alcohol_percentage: String(drink.percentage),
        consumed_at: new Date(drink.date),
      })
    )
  );
};
