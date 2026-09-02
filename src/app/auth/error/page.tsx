import Link from "next/link";

import { AuthPage } from "@/components/auth-page";

export default function AuthErrorPage() {
  return (
    <AuthPage
      description="The confirmation link was invalid or expired. Sign in if the account is already confirmed, or create it again."
      title="We could not confirm that account"
    >
      <Link
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white"
        href="/login"
      >
        Return to sign in
      </Link>
    </AuthPage>
  );
}
