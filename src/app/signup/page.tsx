
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout title="Crie sua conta" description="Comece a usar o ANODE Lite hoje mesmo.">
      <SignupForm />
    </AuthLayout>
  );
}
