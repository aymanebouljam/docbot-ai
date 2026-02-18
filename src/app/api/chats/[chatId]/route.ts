import { deleteChatSession, loadChat } from "@/server/chat-service";
import { getAuthenticatedUserFromRequest } from "@/server/auth-user";

type ChatRouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(request: Request, context: ChatRouteContext) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { chatId } = await context.params;
  const chat = await loadChat(user.id, chatId);

  if (!chat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat });
}

export async function DELETE(request: Request, context: ChatRouteContext) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { chatId } = await context.params;
  const deletedChat = await deleteChatSession(user.id, chatId);

  if (!deletedChat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat: deletedChat });
}
