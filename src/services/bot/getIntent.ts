import { client } from "./client";
import { User } from "../../db/user";
import {
  addBotMessage,
  addUserMessage,
  getBotHistory,
  getUserHistory,
} from "../../lib/redisClient";
import { context } from "../../prompts/context";

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
          ${context}

          L’utilisateur t’envoie un message : tu dois déterminer quelle action parmi les suivantes il veut entreprendre.

          ---
          1. **Enregistrer un ou plusieurs verres consommés**  
          Informations à obtenir :
          - type de boisson ("drinkType", varchar(50))
          - quantité en cl ("quantity", integer)
          - pourcentage d’alcool ("percentage", numeric(5,2))
          - heure de consommation ("date", Date ISO 8601, heure UTC)

          Règles importantes :
          - La propriété "date" doit toujours être enregistrée en ISO 8601 au format UTC (ex. "2025-09-07T18:30:00Z").
          - Si l'utilisateur indique l'heure de consommation relative (ex. "il y a 5 minutes"), **soustraire le temps indiqué à l'heure locale de Belgique** pour obtenir l'heure exacte de consommation, puis convertir en UTC ISO 8601. **Ne jamais ajouter le temps.**
          - Dans le champ "message", indique quelle boisson a été enregistrée et à quelle heure, en convertissant l'heure au fuseau horaire Europe/Brussels (CET/CEST selon la saison), sans préciser à l'utilisateur le fuseau horaire choisi.
          - Si la quantité ou le pourcentage d’alcool manquent, estime-les à partir de valeurs moyennes ou demande plus de précisions si tu n'es pas sûr.
            Valeurs moyennes :
            - shot : 4 cl
            - verre de vin : 12,5 cl
            - canette : 33 cl
            - bouteille de vin : 70 cl
          - Si tu n'as pas l'heure précise ou si l'utilisateur ne donne pas de repère temporel, **ne déclenche pas cette action.**
          - Une boisson par élément dans l'array "drinks".
          - **Ne jamais rajouter de texte supplémentaire dans le message**, ne pas faire de phrases de politesse ou d'ouverture, seulement l'information demandée.

          JSON attendu :
          {
            "action_type": "${ActionType.LogDrink}",
            "drinks": [
              {
                "drinkType": "...",
                "quantity": ...,
                "percentage": ...,
                "date": "..." // ISO 8601 UTC exact
              }
            ],
            "message": "..." // Description de la boisson enregistrée et heure convertie à l'heure belge
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
