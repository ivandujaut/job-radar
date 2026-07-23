"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type OAuthStrategy = "oauth_google" | "oauth_linkedin_oidc";

/**
 * Google + LinkedIn buttons that kick off Clerk's OAuth redirect. The parent
 * passes an `authenticate` bound to either signIn or signUp so the same UI
 * serves both pages.
 */
export function SocialButtons({
  authenticate,
}: {
  authenticate: (strategy: OAuthStrategy) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={() => authenticate("oauth_google")}>
          Google
        </Button>
        <Button type="button" variant="outline" onClick={() => authenticate("oauth_linkedin_oidc")}>
          LinkedIn
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">o con tu email</span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
