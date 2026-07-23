# Safety policy

LinkedIn prohibits automation in its terms of service and actively detects it.
The account being protected here is a core asset of an active job search, so
this project trades throughput for account safety. These rules are not
configurable upward; they are the product.

## Hard rules

1. **Human approval for every outbound action.** Applications and connection
   requests only leave the queue after explicit approval. There is no
   "auto-send" mode.
2. **Human pace.** Max 10 executor actions per day, spread over hours with
   randomized delays (minutes, not seconds). Max 3 connection requests per day.
3. **Real browser session, never headless-obvious.** Session adapter uses the
   gstack browse daemon with imported cookies from the real browser, standard
   user agent, and no parallel sessions.
4. **Read-only discovery is unauthenticated when possible.** Guest endpoints
   first; the logged-in session is only used where guest access fails.
5. **Stop on friction.** Any captcha, warning banner, or unusual redirect
   pauses the executor and requires manual re-enable.
6. **No scraping of personal data at scale.** People discovery is limited to
   the companies in `config/targets.yaml` and to roles relevant to hiring.
