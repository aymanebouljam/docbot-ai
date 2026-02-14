import { ProfileForm } from "@/features/profile/components/profile-form";
import { getLocalUserProfile } from "@/server/local-user";

export default async function ProfilePage() {
  const user = await getLocalUserProfile();

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
