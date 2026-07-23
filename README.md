# job-radar

Agent-driven job search assistant. Agents find LinkedIn roles matching a profile,
rank them with reasons, draft applications and connection notes, and queue
everything for one-click human review. Nothing is sent without approval.

## Architecture

```
[adapters]          [pipeline]                [review]            [executor]
linkedin-guest  ->  rank (LLM score + why) -> queue (approve/  -> send (rate-limited,
manual ingest       notes (draft <=300ch)     edit/reject)        human-paced)
```

- **Adapters** discover job posts and people (hiring managers, recruiters).
  Guest search works without login; session-based search requires importing
  your real browser cookies (see SAFETY.md before enabling).
- **Rank** scores each job against `config/profile.yaml` using an LLM,
  producing a match % and explicit reasons. Threshold rules live in
  `config/rules.yaml`.
- **Notes** drafts connection notes (LinkedIn cap: 300 chars) and short
  application answers, in the tone defined in the profile.
- **Queue** is the single human touchpoint: every outbound action (application
  or connection request) waits in `data/queue.jsonl` until approved, edited,
  or rejected via the CLI.
- **Executor** performs approved actions only, at human pace (see SAFETY.md).
  Not implemented yet: requires an authenticated browser session.

## Usage

```bash
bun install
bun run src/cli.ts scan "product manager" --location "Argentina"   # discover jobs
bun run src/cli.ts rank                                            # score pending jobs
bun run src/cli.ts queue                                           # review queue
bun run src/cli.ts approve <id> | reject <id> | edit <id>
```

Environment: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`.

## Status

- [x] Config schema (profile, rules, targets)
- [x] Queue store + review CLI
- [x] Ranking agent (LLM)
- [x] LinkedIn guest search adapter (no login)
- [ ] Connection-note drafting agent
- [ ] Authenticated session adapter (cookie import, opt-in)
- [ ] Executor with human pacing
- [ ] People finder (managers / recruiters at target companies)
