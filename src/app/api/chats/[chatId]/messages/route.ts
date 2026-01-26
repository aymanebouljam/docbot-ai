import { processUserMessage } from "@/server/chat-service";
import { generateMedicalAnswer } from "@/server/groq";
import { checkRateLimit } from "@/server/rate-limit";
import {
  createUnauthorizedResponse,
  getAuthenticatedUser,
} from "@/server/auth";
import {
  createMessageRequestSchema,
  parseRequestBody,
} from "@/server/validation";

type ChatMessagesRouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function POST(request: Request, context: ChatMessagesRouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return createUnauthorizedResponse();
  }

  const { chatId } = await context.params;
  const rateLimit = checkRateLimit({ request, scope: `chat-message:${chatId}` });

  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: "Too many messages sent too quickly. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(createMessageRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Invalid message payload.", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const result = await processUserMessage({
    userId: user.id,
    chatId,
    content: parsedBody.data.content,
    generateMedicalReply: async ({ content, history }) =>
      generateMedicalAnswer({
        prompt: content,
        history,
      }),
  });

  if (!result) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json(result, { status: 201 });
}
