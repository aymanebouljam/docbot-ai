import { ProfileForm } from "@/features/profile/components/profile-form";
import { getAuthenticatedUser } from "@/server/auth-user";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  return (
    <ProfileForm
      initialUser={{
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      }}
    />
  );
}
