import { loadChat } from "@/server/chat-service";
import {
  createUnauthorizedResponse,
  getServerAuthSession,
} from "@/server/auth";

type ChatRouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: ChatRouteContext) {
  const session = await getServerAuthSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { chatId } = await context.params;
  const chat = await loadChat(chatId);

  if (!chat) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  return Response.json({ chat });
}
