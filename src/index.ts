import express, { Request } from "express";
import { connectRedis } from "./lib/redisClient";
import { processMessage } from "./services/bot";
import { handleIncomingMessage } from "./services/messenger";
import "./services/cron";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

interface MessageRequestBody {
  phoneNumber: string;
  message: string;
}

app.post(
  "/messenger-hook",
  async (req: Request<{}, {}, MessageRequestBody>) => {
    handleIncomingMessage({ body: req.body });
  }
);

app.post("/message", async (req: Request<{}, {}, MessageRequestBody>, res) => {
  const { phoneNumber, message } = req.body ?? {};

  if (typeof phoneNumber !== "string" || typeof message !== "string") {
    res.status(400).json({ error: "phoneNumber and message must be strings" });
    return;
  }

  const responseMessage = await processMessage({ phoneNumber, message });

  res.status(200).json({ message: responseMessage });
});

app.listen(PORT, () => {
  connectRedis();
  console.log(`Server is running on ${PORT}`);
});
