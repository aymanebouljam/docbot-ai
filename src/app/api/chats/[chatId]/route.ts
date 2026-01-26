import { loadChat } from "@/server/chat-service";
import {
  createUnauthorizedResponse,
  getAuthenticatedUser,
} from "@/server/auth";

type ChatRouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: ChatRouteContext) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return createUnauthorizedResponse();
  }

  const { chatId } = await context.params;
  const chat = await loadChat(user.id, chatId);

  if (!chat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat });
}
