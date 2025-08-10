import "dotenv/config";
import { getUserByPhone } from "../user";
import { handleUserCreation } from "./createUser";
import { getIntent, ActionType } from "./getIntent";
import { clearBotHistory, clearUserHistory } from "../../lib/redisClient";
import { logDrink } from "./logDrink";
import { getBac } from "./getBac";

export const processMessage = async ({
  message,
  phoneNumber,
}: {
  message: string;
  phoneNumber: string;
}): Promise<string> => {
  const user = await getUserByPhone(phoneNumber);

  if (!user) {
    return await handleUserCreation({ message, phoneNumber });
  }

  const intent = await getIntent({ user, message });

  const actionType = ("action_type" in intent && intent.action_type) ?? null;

  if (actionType !== "continue") {
    await clearUserHistory(String(user.id));
    await clearBotHistory(String(user.id));
  }

  switch (actionType) {
    case ActionType.LogDrink:
      logDrink({ drinks: intent.drinks, user });
      return intent.message ?? "";
    case ActionType.BacRequest:
      return await getBac({ user });
    default:
      return intent.message ?? "";
  }
};
