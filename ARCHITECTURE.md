# Architecture

This document explains how AI Candidate Avatar is built and why — for anyone reviewing the code, considering a contribution, or self-hosting their own copy.

---

## 1. The Two Journeys

Everything in this system exists to serve two flows:

### Candidate: build and publish an avatar
```
Sign up ──> Upload resume + optional docs ──> Parse & chunk ──> Embed
   │                                                              │
   └──────────────── Sandbox test-chat ◄────────────── Store in pgvector
                             │
                    Automated safety check
                    (adversarial probe questions)
                             │
                          Publish
                             │
                    Get shareable link (/u/[slug])
```

### Recruiter: interview the avatar
```
Open /u/[slug] ──> Enter name (email optional) ──> Chat
                                                       │
                                       Rate-limited, RAG-grounded
                                       responses with citations
                                                       │
                                                  End session
                                                       │
                              Scorecard + PDF transcript generated
                                                       │
                              Emailed if address given, always
                              downloadable as PDF either way
```

---

## 2. System Components

| Layer | Technology | Role |
|---|---|---|
| App & API | Next.js (TypeScript), on Vercel | Single codebase serves the candidate dashboard, the public recruiter chat, and all API routes |
| Database | Supabase (PostgreSQL) | Relational data — users, avatars, sessions, scorecards |
| Vector search | Supabase (pgvector, HNSW index) | Semantic search over each candidate's knowledge base |
| File storage | Supabase Storage (private bucket) | Original uploaded resumes/supporting documents |
| Auth | Supabase Auth | Candidate accounts only — recruiters never need one |
| LLM | Google Gemini (`@google/genai`) | Chat responses, embeddings, summaries, safety checks, scorecards |
| Rate limiting | Upstash Redis | Sliding-window caps on chat usage |
| Email | Resend | Optional transcript/scorecard delivery |

All five external services (Supabase, Gemini, Upstash, Resend, Vercel) are used within their free tiers — this is a deliberate constraint, not an accident, so anyone can self-host at zero cost.

---

## 3. Data Model

- **`users`** — candidate accounts (Supabase Auth-linked). Recruiters have no row here at all.
- **`avatars`** — one per candidate. Holds `status` (draft/published/paused), `visibility` (public/link-only/permissioned), and the share `slug`.
- **`knowledge_sources`** — metadata for each uploaded file (resume or supplement).
- **`document_chunks`** — parsed, chunked text with a vector embedding and a human-readable citation pointer back to its source. **Every row belongs to exactly one `avatar_id`.**
- **`avatar_summary_cache`** — a pre-generated 3-bullet summary, served instantly for common opening questions so they don't cost an LLM call.
- **`chat_sessions`** / **`chat_messages`** — one recruiter conversation and its turn-by-turn history. `recruiter_email` is nullable — only `recruiter_name` is required.
- **`scorecards`** — the post-session brief: topic coverage, cited evidence, and open/unanswered questions. Deliberately **not** a numeric score.
- **`publish_checks`** — results of the pre-publish adversarial probe run.

---

## 4. Why It's Built This Way

### Grounding is enforced at two layers, not one
The system prompt instructs the model to answer only from retrieved chunks — but prompts alone are not a hard guarantee. Before an avatar can go live, it's automatically tested against a fixed set of likely recruiter questions (salary expectations, plausible-but-absent skills, "tell me about a failure"), and any answer that doesn't trace back to a real source chunk is flagged for the candidate to review. This catches drift that prompt instructions alone might miss, without requiring a human reviewer in the loop for every candidate.

### Retrieval is scoped per-avatar, always
Every vector similarity search runs through a single database function (`match_document_chunks`) that hard-filters on `avatar_id`. This isn't just an application-layer convention — it's enforced at the query level, so there's no code path that can accidentally return one candidate's information inside another candidate's answers.

### The scorecard is a factual brief, not a score
An AI-generated numeric rating of a candidate is a bias risk the product deliberately avoids. The scorecard only ever reports what was discussed, what evidence was cited, and what fell outside the resume's scope — description, not judgment.

### Recruiters never need an account
Requiring a recruiter to sign up before they can ask a candidate a few questions is exactly the kind of friction that would kill adoption. The tradeoff: session identity is just a name (email optional), so a `permissioned`-visibility avatar enforces its allow-list by checking whatever email is provided, rather than a verified login. That's a deliberate MVP tradeoff — noted here so it's not mistaken for an oversight — see [Known Limitations](#5-known-limitations-worth-knowing-about) below.

### Model names are never hardcoded
Google rotates Gemini's flash-tier models every few months, each with its own retirement date. Both the chat and embedding model names are read from environment variables with sensible defaults, so a model deprecation is a config change, not a code change and redeploy — important for a project meant to be forked and left running by people who aren't actively maintaining it day to day.

### Delivery degrades gracefully
Email delivery depends on a third-party service and domain verification that a self-hoster might not have set up yet. Rather than the product being broken without it, the downloadable PDF is the primary way anyone gets their transcript — email is a bonus on top, only claimed as sent once it's actually confirmed to have gone out.

---

## 5. Known Limitations (Worth Knowing About)

Documented here deliberately, rather than left for someone to discover the hard way:

- **Permissioned-avatar access is email-based, not identity-verified.** A recruiter's entered email is trusted as-is; it's not confirmed via a magic link. Sufficient for an MVP, not tamper-proof.
- **Rate limits are per-avatar and per-session, not per-recruiter-identity.** Since recruiters don't need accounts, someone could open multiple sessions to work around the per-session message cap. The per-avatar daily cap is the actual backstop.
- **Free-tier ceilings are real.** Supabase, Upstash, and Resend free tiers all have usage caps; a genuinely popular avatar could hit them. This is an intentional tradeoff for a zero-cost MVP, not something masked or hidden from operators.

---

## 6. Where to Look in the Code

| I want to understand... | Look at |
|---|---|
| How resumes get parsed and chunked | `lib/parsers/`, `lib/ai/rag.ts` |
| The avatar's persona and grounding rules | `lib/ai/prompts.ts` |
| Gemini API calls | `lib/ai/geminiClient.ts` |
| Rate limiting logic | `lib/ratelimit.ts` |
| Email delivery + failure handling | `lib/email.ts` |
| Database schema and RLS policies | `supabase/migrations/` |
| The recruiter chat experience | `app/u/[slug]/` |
| The candidate dashboard and publish flow | `app/dashboard/avatars/[id]/` |