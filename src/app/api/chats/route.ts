import {
  createChatSession,
  deleteAllChatSessions,
  loadChatList,
} from "@/server/chat-service";
import { getLocalUserProfile } from "@/server/local-user";
import { createChatRequestSchema, parseRequestBody } from "@/server/validation";

export async function POST(request: Request) {
  const user = await getLocalUserProfile();

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
  const user = await getLocalUserProfile();
  const chats = await loadChatList(user.id);
  return Response.json({ chats });
}

export async function DELETE() {
  const user = await getLocalUserProfile();

  const result = await deleteAllChatSessions(user.id);

  return Response.json({ deletedCount: result.count });
}
