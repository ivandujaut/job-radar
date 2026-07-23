import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      // Every 6 hours. Keep it modest: each pass scans boards and spends LLM
      // tokens. The engine's daily cap bounds how many applications go out.
      path: "/api/engine",
      schedule: "0 */6 * * *",
    },
  ],
};
