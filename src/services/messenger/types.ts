import * as z from "zod";

export const Message = z.object({
  dataType: z.enum(["message_create"]),
  data: z.object({
    message: z.object({
      body: z.string(),
      from: z.string(),
      fromMe: z.boolean(),
      timestamp: z.number(),
    }),
  }),
});
