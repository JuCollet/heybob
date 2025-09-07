import { User } from "../../db/user";
import { client } from "./client";
import { context } from "../../prompts/context";
import { deleteReminder, getUserReminders } from "../../db/reminder";

export const deleteBacReminder = async ({
  user,
}: {
  user: User;
}): Promise<string> => {
  const reminders = await getUserReminders(user.id);

  if (reminders) {
    for (const reminder of reminders) {
      await deleteReminder(reminder.id);
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            ${context}
            Informe l'utilisateur que les rappels programmés pour le prévenir quand il pourra prendre la route ont été supprimés.
        `,
        },
      ],
    });

    return response.choices[0].message.content ?? "";
  }

  return "";
};
