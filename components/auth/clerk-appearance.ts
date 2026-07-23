/**
 * Strips Clerk's default card chrome so its prebuilt SignIn/SignUp blend into
 * our own AuthShell: transparent background, no border/shadow, themed inputs
 * and buttons. This is the reliable way to get a custom look on Clerk 7.5,
 * whose signals-based custom-flow hooks are still experimental.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "oklch(0.922 0 0)",
    colorText: "oklch(0.985 0 0)",
    colorTextSecondary: "oklch(0.708 0 0)",
    colorBackground: "transparent",
    colorInputBackground: "oklch(0.205 0 0)",
    colorInputText: "oklch(0.985 0 0)",
    borderRadius: "0.625rem",
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "bg-transparent shadow-none border-0 p-0 w-full",
    header: "hidden",
    footer: "bg-transparent",
    footerAction: "text-muted-foreground",
    socialButtonsBlockButton: "border-border bg-transparent hover:bg-muted",
    dividerLine: "bg-border",
    formFieldInput: "bg-input border-border",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none normal-case text-sm",
    logoBox: "hidden",
  },
} as const;
