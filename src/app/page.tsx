import { ChatShell } from "@/features/chat/components/chat-shell";
import { getAuthenticatedUser } from "@/server/auth-user";
import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<{ chatId?: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const initialChatId = Array.isArray(resolvedSearchParams.chatId)
    ? resolvedSearchParams.chatId[0]
    : resolvedSearchParams.chatId;
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in?callbackUrl=/");
  }

  return (
    <ChatShell
      initialChatId={initialChatId ?? null}
      currentUserEmail={user.email}
      currentUserName={user.name}
      currentUserImage={user.image ?? undefined}
    />
  );
}
