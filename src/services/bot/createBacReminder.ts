import { getEstimateBACFromLogs, getTimeToBacTarget } from "../../utils/bac";
import { getDrinksLogsLast24h } from "../../db/drink";
import { User } from "../../db/user";
import { client } from "./client";
import { context } from "../../prompts/context";
import {
  createReminder,
  deleteReminder,
  getUserReminders,
} from "../../db/reminder";

export const SAFE_BAC_TARGET = 0.5;

export const createBacReminder = async ({
  user,
}: {
  user: User;
}): Promise<string> => {
  const reminders = await getUserReminders(user.id);

  if (reminders) {
    for (const reminder of reminders) {
      await deleteReminder(reminder.id);
    }
  }

  const drinks = await getDrinksLogsLast24h(user.id);
  const bac = getEstimateBACFromLogs(drinks, user);
  const bacFormatted = typeof bac === "number" ? bac.toFixed(2) + "g/L" : bac;

  if (!bac || bac < SAFE_BAC_TARGET) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            ${context}
            Le taux d'alcoolémie estimé de l'utilisateur est de ${bacFormatted}.  
            Informe l'utilisateur qu'il semble déjà avoir un taux d'alcoolémie inférieur à la limite belge pour conduire.
            Précise que c'est une estimation basée sur les données enregistrées,
            que cela ne remplace pas un test d'alcoolémie officiel,
            et qu'il ne faut jamais prendre le volant après avoir consommé de l'alcool.
            Informe des limites légales en Belgique.
        `,
        },
      ],
    });

    return response.choices[0].message.content ?? "";
  }

  const timeToSafeBack = getTimeToBacTarget({
    bacInitial: bac,
    bacTarget: SAFE_BAC_TARGET,
    gender: user.gender,
  });

  if (!timeToSafeBack) {
    return "";
  }

  await createReminder(user.id, "can_drive", timeToSafeBack);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
            ${context}
            Le taux d'alcoolémie estimé de l'utilisateur est de ${bacFormatted}.  
            Informe l'utilisateur qu'un rappel a été programmé à ${timeToSafeBack.toLocaleString("fr-BE", { timeZone: "Europe/Brussels" })}, heure belge, 
            à laquelle le taux d'alcoolémie devrait avoir redescendu en dessous de la limite légale pour conduire en Belgique.
            Ne converti pas cette date et cette heure, affiche-là telle que je te la donne.
        `,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
};
