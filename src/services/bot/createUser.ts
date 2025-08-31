import { client } from "./client";
import {
  addBotMessage,
  addUserMessage,
  clearBotHistory,
  clearUserHistory,
  getBotHistory,
  getUserHistory,
} from "../../lib/redisClient";
import { addUserIfNotExists } from "../../db/user";
import { basePromptContext } from "./common";

const isValidGender = (g: any) => ["m", "f", "x"].includes(g);
const isValidWeight = (w: any) => Number.isInteger(w) && w > 20 && w < 300;

export const handleUserCreation = async ({
  message,
  phoneNumber,
}: {
  message: string;
  phoneNumber: string;
}): Promise<string> => {
  await addUserMessage(phoneNumber, message);

  const userMessages = (await getUserHistory(phoneNumber)).map((content) => ({
    role: "user" as const,
    content,
  }));

  const botMessages = (await getBotHistory(phoneNumber)).map((content) => ({
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
          L'utilisateur doit donner son genre et son poids.
          Réponds sous forme de json avec les champs "gender" (m, f ou x), "weight" (int - en kilogrammes) avec null comme valeur si les infos manquent, 
          ou si les valeurs ne correspondent pas à ce qu'on attend ou semblent incorrectes.
        `,
      },
      ...userMessages,
    ],
    response_format: { type: "json_object" },
  });

  let userInfo = null;
  try {
    userInfo = JSON.parse(response.choices[0].message.content ?? "");
  } catch {
    userInfo = null;
  }

  if (
    userInfo &&
    isValidGender(userInfo.gender) &&
    isValidWeight(userInfo.weight)
  ) {
    await clearUserHistory(phoneNumber);
    await clearBotHistory(phoneNumber);
    await addUserIfNotExists({
      phone_number: phoneNumber,
      weight: userInfo.weight,
      gender: userInfo.gender,
    });

    const feedback = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...botMessages,
        {
          role: "system",
          content: `
            ${basePromptContext}
            L'utilisateur a donné toutes les infos, remercie-le et dis-lui qu'il peut commencer à te dire 
            ce qu'il boit pour avoir une estimation de son taux d'alcoolémie ou pour recevoir un message quand il peut reprendre la route.
          `,
        },
        ...userMessages,
      ],
    });

    return feedback.choices[0].message?.content ?? "";
  }

  const feedback = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Tu es un assistant qui ne se présente qu'une seule fois au début de la conversation.",
      },
      ...botMessages,
      {
        role: "system",
        content: `
          ${basePromptContext}
          Pour l’instant, ta tâche est uniquement d’enregistrer les données personnelles de l’utilisateur, qui n’est pas encore connu.
          Demande-lui son genre et son poids.
          Si l’utilisateur a déjà fourni certaines informations, demande celles qui manquent ou de confirmer celles qui semblent incorrectes.          
        `,
      },
      ...userMessages,
    ],
  });

  const res = feedback.choices[0].message?.content ?? "";
  await addBotMessage(phoneNumber, res);

  return res;
};
