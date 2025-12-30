import { addUserMessageToChat } from "@/server/chat-service";

type ChatMessagesRouteContext = {
  params: Promise<{ chatId: string }>;
};

type CreateMessageRequestBody = {
  content?: unknown;
};

export async function POST(request: Request, context: ChatMessagesRouteContext) {
  const { chatId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateMessageRequestBody;

  if (typeof body.content !== "string" || body.content.trim().length === 0) {
    return Response.json(
      { error: "Message content must be a non-empty string." },
      { status: 400 }
    );
  }

  const message = await addUserMessageToChat(chatId, body.content);

  if (!message) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ message }, { status: 201 });
}
