import { ChatShell } from "@/features/chat/components/chat-shell";

type HomePageProps = {
  searchParams: Promise<{ chatId?: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const initialChatId = Array.isArray(resolvedSearchParams.chatId)
    ? resolvedSearchParams.chatId[0]
    : resolvedSearchParams.chatId;

  return <ChatShell initialChatId={initialChatId ?? null} />;
}
