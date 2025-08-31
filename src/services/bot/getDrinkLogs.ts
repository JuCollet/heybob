import { getDrinksLogsLast24h } from "../../db/drink";
import { User } from "../../db/user";

export const getDrinkLogs = async ({ user }: { user: User }) => {
  return (await getDrinksLogsLast24h(user.id)) ?? "";
};
