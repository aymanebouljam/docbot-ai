import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export default async function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start your medical conversations with DocBot."
    >
      <RegisterForm />
    </AuthShell>
  );
}
