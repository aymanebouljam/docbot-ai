import { createChatSession, loadChatList } from "@/server/chat-service";
import {
  createUnauthorizedResponse,
  getAuthenticatedUser,
} from "@/server/auth";
import {
  createChatRequestSchema,
  parseRequestBody,
} from "@/server/validation";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return createUnauthorizedResponse();
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(createChatRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Invalid chat payload.", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const chat = await createChatSession(user.id, parsedBody.data.title);

  return Response.json({ chat }, { status: 201 });
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return createUnauthorizedResponse();
  }

  const chats = await loadChatList(user.id);

  return Response.json({ chats });
}
