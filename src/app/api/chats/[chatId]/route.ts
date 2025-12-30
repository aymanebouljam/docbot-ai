import { loadChat } from "@/server/chat-service";

type ChatRouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: ChatRouteContext) {
  const { chatId } = await context.params;
  const chat = await loadChat(chatId);

  if (!chat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat });
}
