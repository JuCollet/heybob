import "dotenv/config";
import { getUserByPhone } from "../user";
import { handleUserCreation } from "./createUser";

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

  return "ready";
};
