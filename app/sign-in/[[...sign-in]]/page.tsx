import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/src/auth.ts";

export default function SignInPage() {
  // In cookie mode there is no Clerk sign-in; send users to the email login.
  if (!clerkEnabled()) redirect("/login");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </main>
  );
}
