import { getEstimateBACFromLogs } from "../../utils/bac";
import { getDrinksLogsLast24h } from "../../db/drink";
import { User } from "../../db/user";
import { client } from "./client";
import { basePromptContext } from "./common";

export const getBac = async ({ user }: { user: User }): Promise<string> => {
  const drinks = await getDrinksLogsLast24h(user.id);
  const bac = getEstimateBACFromLogs(drinks, user);

  const bacFormatted = typeof bac === "number" ? bac.toFixed(2) + "g/L" : bac;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
            ${basePromptContext}
            Le taux d'alcoolémie estimé de l'utilisateur est de ${bacFormatted}.  
            Informe l'utilisateur de ce résultat, en précisant que c'est une estimation basée sur les données enregistrées,  
            que cela ne remplace pas un test d'alcoolémie officiel,  
            et qu'il ne faut jamais prendre le volant après avoir consommé de l'alcool.
            Informe des limites légales en Belgique.
        `,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
};
