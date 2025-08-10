import { getDrinksLogsLast24h } from "../drink";
import { User } from "../user";

export const getDrinkLogs = async ({ user }: { user: User }) => {
  return (await getDrinksLogsLast24h(user.id)) ?? "";
};
