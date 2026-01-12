import { createChatSession, loadChatList } from "@/server/chat-service";
import {
  createChatRequestSchema,
  parseRequestBody,
} from "@/server/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsedBody = parseRequestBody(createChatRequestSchema, body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Invalid chat payload.", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const chat = await createChatSession(parsedBody.data.title);

  return Response.json({ chat }, { status: 201 });
}

export async function GET() {
  const chats = await loadChatList();

  return Response.json({ chats });
}
