import { processMessage } from "../bot";
import { Message } from "./types";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const handleIncomingMessage = async ({ body }: { body: unknown }) => {
  try {
    const message = Message.parse(body);
    const { data, dataType } = message;

    if (
      dataType === "message_create" &&
      !data.message.fromMe &&
      data.message.body &&
      data.message.timestamp * 1000 >= Date.now() - FIVE_MINUTES_MS
    ) {
      const phoneNumber = data.message.from;
      const responseMessage = await processMessage({
        phoneNumber,
        message: data.message.body,
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
          chatId: phoneNumber,
          contentType: "string",
          content: responseMessage,
        }),
      });
    }
  } catch {}
};
