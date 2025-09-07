import { getEstimateBACFromLogs } from "../../utils/bac";
import { getDrinksLogsLast24h } from "../../db/drink";
import { User } from "../../db/user";
import { client } from "./client";
import { context } from "../../prompts/context";

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
            ${context}
            Le taux d'alcoolémie estimé de l'utilisateur est de ${bacFormatted}.  
            Informe l'utilisateur de ce résultat en précisant : 
            - que c'est une estimation basée sur les données enregistrées,  
            - que cela ne remplace pas un test d'alcoolémie officiel,  
            - qu'il ne faut jamais prendre le volant après avoir consommé de l'alcool.  

            Indique les limites légales en Belgique.  
            Si le taux d'alcoolémie dépasse 0.5, informe que l'utilisateur peut demander un rappel quand son taux devrait être redescendu en dessous de la limite légale.  
            Si le taux est en dessous de 0.5, ne dis rien d'autre.  
            **Ne propose rien d'autre, ne rajoute aucune phrase, aucun conseil, aucun mot de politesse, aucune ouverture. Répond uniquement avec les informations ci-dessus.**
        `,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
};
