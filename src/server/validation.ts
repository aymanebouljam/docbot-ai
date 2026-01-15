import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 2_000;
export const MAX_CHAT_TITLE_LENGTH = 120;

function normalizeInputText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export function normalizeStoredContent(value: string) {
  return normalizeInputText(value);
}

export const createChatRequestSchema = z.object({
  title: z
    .string()
    .transform(normalizeInputText)
    .pipe(z.string().max(MAX_CHAT_TITLE_LENGTH))
    .optional(),
});

export const createMessageRequestSchema = z.object({
  content: z
    .string()
    .transform(normalizeInputText)
    .pipe(z.string().min(1, "Message content is required."))
    .pipe(
      z
        .string()
        .max(
          MAX_MESSAGE_LENGTH,
          `Message content must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
        )
    ),
});

export function parseRequestBody<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown
) {
  return schema.safeParse(input);
}
