import { client } from "./client";
import { User } from "../../db/user";
import {
  addBotMessage,
  addUserMessage,
  getBotHistory,
  getUserHistory,
} from "../../lib/redisClient";
import { basePromptContext } from "./common";

export enum ActionType {
  LogDrink = "log_drink",
  BacRequest = "bac_request",
  UpdateUserData = "update_user_data",
  GetUserDetails = "get_user_details",
  GetDrinksLogs = "get_drinks_logs",
  CreateReminder = "create_reminder",
  CancelReminder = "cancel_reminder",
  Continue = "continue",
}

export const getIntent = async ({
  user,
  message,
}: {
  user: User & Pick<Required<User>, "id">;
  message: string;
}) => {
  const userMessages = (await getUserHistory(String(user.id))).map(
    (content) => ({
      role: "user" as const,
      content,
    })
  );

  const botMessages = (await getBotHistory(String(user.id))).map((content) => ({
    role: "assistant" as const,
    content,
  }));

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...botMessages,
      {
        role: "system",
        content: `
          La date et l'heure actuelle est ${new Date().toISOString()}.
          L'utilisateur pèse ${user.weight} kg et est de sexe ${user.gender}.
        `,
      },
      {
        role: "system",
        content: `
          ${basePromptContext}

          L’utilisateur t’envoie un message : tu dois déterminer quelle action parmi les suivantes il veut entreprendre.

          ---
            1. **Enregistrer un ou plusieurs verres consommés**
            Informations à obtenir :
            - type de boisson ("drinkType", varchar(50))
            - quantité en cl ("quantity", integer)
            - pourcentage d’alcool ("percentage", numeric(5,2))
            - heure de consommation ("date", Date ISO 8601, heure GMT)

            Si la quantité ou le pourcentage d'alcool manquent, estime-les à partir de valeurs moyennes ou demande plus de précisions si tu n'es pas sûr.
            Voici quelques quantités moyennes :
            - shot : 4 cl
            - verre de vin : 12,5 cl
            - canette : 33 cl
            - bouteille de vin : 70 cl

            Si tu n'as pas l'heure précise, ne déclanche pas cette action.
            Une boisson par élément dans l'array "drinks".
            Dans le "message" retourné, répète précisément toutes les boissons qui ont été enregistrées et une copie de l'heure de consommation, convertie à l'heure belge (fuseau horaire Europe/Brussels).

            JSON attendu :
            {
              "action_type": "${ActionType.LogDrink}",
              "drinks": [
                {
                  "drinkType": "...",
                  "quantity": ...,
                  "percentage": ...,
                  "date": "...",
                }
              ],
              "message": "..."
            }

          2. **Demander sa consommation d’alcool**
            JSON attendu :
            {
              "action_type": "${ActionType.BacRequest}",
              "message": "..."
            }

          3. **Modifier ses données personnelles (poids, genre)**
            Les champs sont optionnels si non précisés.
            JSON attendu :
            {
              "action_type": "${ActionType.UpdateUserData}",
              "weight": ...,
              "gender": "...",
              "message": "..."
            }

          4. **Connaître ses données enregistrées**
            JSON attendu :
            {
              "action_type": "${ActionType.GetUserDetails}",
              "message": "..."
            }

          5. **Recevoir un rappel quand le taux d'alcoolémie est descendu en dessous de la limite légale pour conduire**
            JSON attendu :
            {
              "action_type": "${ActionType.CreateReminder}",
              "message": "..."
            }

          6. **Annuler un rappel déjà programmé**
            JSON attendu :
            {
              "action_type": "${ActionType.CancelReminder}",
              "message": "..."
            }

          7. **Recevoir la liste des boissons enregistrées**
            JSON attendu :
            {
              "action_type": "${ActionType.GetDrinksLogs}",
              "message": "..."
            }

          ---

          Si tu n’as pas assez d’informations pour déclencher une action, renvoie :
          {
            "action_type": "${ActionType.Continue}",
            "message": "..."
          }

          **Règles supplémentaires :**
          - "message" doit être dans la langue de l’utilisateur.
          - Ne renvoie jamais de texte en dehors du JSON.
          - JSON toujours valide et correctement formaté.
        `,
      },
      ...userMessages,
      {
        role: "user",
        content: message,
      },
    ],
    response_format: { type: "json_object" },
  });

  await addUserMessage(String(user.id), message);

  let intent = null;
  try {
    intent = JSON.parse(response.choices[0].message.content ?? "");

    console.log(JSON.stringify(intent));

    "message" in intent &&
      (await addBotMessage(String(user.id), intent.message));
  } catch {
    intent = null;
  }

  return intent;
};
