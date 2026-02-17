import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 2_000;
export const MAX_CHAT_TITLE_LENGTH = 120;
export const MAX_USER_NAME_LENGTH = 80;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PROFILE_IMAGE_LENGTH = 2_000_000;

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

export const registerRequestSchema = z.object({
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
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    ),
});

export const signInRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required."),
});

const optionalProfileImageSchema = z
  .union([
    z.null(),
    z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          value.startsWith("data:image/") ||
          value.startsWith("http://") ||
          value.startsWith("https://"),
        "Profile image must be an image data URL or image URL."
      )
      .transform((value) => (value === "" ? null : value))
      .pipe(z.union([z.null(), z.string().max(MAX_PROFILE_IMAGE_LENGTH)])),
  ])
  .optional();

export const updateProfileRequestSchema = z
  .object({
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
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    image: optionalProfileImageSchema,
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const wantsPasswordChange = Boolean(
      value.currentPassword || value.newPassword
    );

    if (!wantsPasswordChange) {
      return;
    }

    if (!value.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Current password is required to set a new password.",
      });
    }

    if (!value.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "New password is required.",
      });
      return;
    }

    if (value.newPassword.length < MIN_PASSWORD_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }
  });

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export function parseRequestBody<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown
) {
  return schema.safeParse(input);
}
