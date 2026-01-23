import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 2_000;
export const MAX_CHAT_TITLE_LENGTH = 120;
export const MAX_USER_NAME_LENGTH = 80;
export const MIN_PASSWORD_LENGTH = 8;

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

export const registerUserRequestSchema = z.object({
  name: z
    .string()
    .transform(normalizeInputText)
    .pipe(z.string().min(1, "Name is required."))
    .pipe(
      z
        .string()
        .max(
          MAX_USER_NAME_LENGTH,
          `Name must be ${MAX_USER_NAME_LENGTH} characters or fewer.`
        )
    ),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    ),
});

export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;

export function parseRequestBody<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown
) {
  return schema.safeParse(input);
}
