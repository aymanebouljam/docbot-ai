import { deleteChatSession, loadChat } from "@/server/chat-service";
import { getLocalUserProfile } from "@/server/local-user";

type ChatRouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: ChatRouteContext) {
  const user = await getLocalUserProfile();

  const { chatId } = await context.params;
  const chat = await loadChat(user.id, chatId);

  if (!chat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat });
}

export async function DELETE(_request: Request, context: ChatRouteContext) {
  const user = await getLocalUserProfile();

  const { chatId } = await context.params;
  const deletedChat = await deleteChatSession(user.id, chatId);

  if (!deletedChat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat: deletedChat });
}
