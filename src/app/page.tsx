import { ChatShell } from "@/features/chat/components/chat-shell";
import { getLocalUserProfile } from "@/server/local-user";

type HomePageProps = {
  searchParams: Promise<{ chatId?: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const initialChatId = Array.isArray(resolvedSearchParams.chatId)
    ? resolvedSearchParams.chatId[0]
    : resolvedSearchParams.chatId;
  const user = await getLocalUserProfile();

  return (
    <ChatShell
      initialChatId={initialChatId ?? null}
      currentUserEmail={user.email}
      currentUserName={user.name}
      currentUserImage={user.image ?? undefined}
    />
  );
}
