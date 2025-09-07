import { client } from "../bot/client";
import cron from "node-cron";
import { getDueReminders } from "../../db/reminder";
import { getUserById } from "../../db/user";
import { getDrinksLogsLast24h } from "../../db/drink";
import { getEstimateBACFromLogs } from "../../utils/bac";
import { createBacReminder, SAFE_BAC_TARGET } from "../bot/createBacReminder";
import { context } from "../../prompts/context";
import { deleteBacReminder } from "../bot/deleteBacReminder";

cron.schedule("* * * * *", async () => {
  const reminders = await getDueReminders();

  if (!reminders.length) {
    return;
  }

  for (const reminder of reminders) {
    const user = await getUserById(reminder.user_id);

    if (!user) {
      continue;
    }

    const drinks = await getDrinksLogsLast24h(user.id);
    const bac = getEstimateBACFromLogs(drinks, user);
    const bacFormatted = typeof bac === "number" ? bac.toFixed(2) + "g/L" : bac;
    deleteBacReminder({ user });

    if (!bac || bac < SAFE_BAC_TARGET) {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
            ${context}
            Le taux d'alcoolémie estimé de l'utilisateur est de ${bacFormatted}.  
            Informe l'utilisateur que son taux d'alcoolémie estimé pourrait être inférieur à la limite légale en Belgique 
            et qu'il pourrait être en mesure de reprendre la route.
            Précise que c'est une estimation basée sur les données enregistrées,
            que cela ne remplace pas un test d'alcoolémie officiel,
            et qu'il ne faut jamais prendre le volant après avoir consommé de l'alcool.
            Informe des limites légales en Belgique.
        `,
          },
        ],
      });

      fetch("http://messenger:3000/client/sendMessage/bob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.WWEBJS_API_KEY && {
            "x-api-key": process.env.WWEBJS_API_KEY,
          }),
        },
        body: JSON.stringify({
          chatId: user.phone_number,
          contentType: "string",
          content: response.choices[0].message.content,
        }),
      });
    }

    if (bac && bac > SAFE_BAC_TARGET) {
      createBacReminder({ user });
    }
  }
});
