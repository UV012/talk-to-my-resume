# AI Candidate Avatar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![100% Free to Run](https://img.shields.io/badge/Cost-100%25%20Free-brightgreen.svg)](#-built-to-be-100-free)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fyour-repo-name&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,GEMINI_API_KEY,GEMINI_CHAT_MODEL,GEMINI_EMBEDDING_MODEL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,RESEND_API_KEY,NEXT_PUBLIC_APP_URL)

**Turn your resume into an AI you can talk to.**

Upload your resume, get a shareable link, and let recruiters have a real conversation with an AI version of you — one that only ever answers from what's actually on your resume, and tells them honestly when something isn't. No app to install, no account needed on the recruiter's side, and it's completely free to run.

---

## 🎯 What is this, really?

If you're job hunting, screening calls eat up a huge amount of time — both yours and the recruiter's — on the same handful of questions. **AI Candidate Avatar** lets a recruiter get those answers the moment they're curious, at 2am if that's when they're reviewing candidates, without waiting for a callback.

It's not a chatbot that makes things up to sound impressive. It's built around one rule: **the avatar only ever speaks from your resume and whatever else you choose to give it.** If a recruiter asks about a skill you don't have, it says so — honestly, in character — instead of guessing.

### 👩‍💼 If you're a recruiter

Someone shared a link with you that looks like `/u/their-name`? Just open it — no sign-up, no password. Type your name, ask whatever you'd ask in a real screening call, and you'll get grounded, cited answers in real time. At the end, you'll get a clean summary of what was covered and a downloadable transcript.

### 👤 If you're job hunting

Upload your resume (and anything else that captures your experience — a portfolio doc, project write-ups, even a YAML/Markdown notes file). The app builds a private, personal chatbot version of you. You test it yourself before it ever goes live, review exactly what it says, and only then share your link. You stay in control of your knowledge base at all times — add to it, edit it, pause your avatar, or delete it whenever you want.

---

## ✨ Key Features

- **Grounded, honest answers** — every response is checked against your actual resume content, with inline citations back to the source. If it's not on record, the avatar says so instead of inventing an answer.
- **You review before it goes live** — a sandbox lets you test-chat with your own avatar, and an automated safety check probes it with likely recruiter questions before you can publish.
- **Zero friction for recruiters** — no login, no account, just a name and a conversation.
- **Multi-format knowledge base** — upload your resume plus supporting docs in PDF, DOCX, YAML, Markdown, or plain text.
- **Instant, cost-free opening answers** — common questions like "tell me about yourself" are served from a cached summary, not a fresh AI call every time.
- **Fair usage limits, built in** — sensible per-session and per-day caps keep the app usable for everyone without needing anyone to pay for it.
- **A real summary, not a score** — after each chat, both sides get a factual brief (what was discussed, evidence cited, anything left unanswered) — never an algorithmic rating of the candidate.
- **Your data stays yours** — private storage, strict per-candidate isolation (no other candidate's information can ever leak into your avatar's answers), and full delete-on-request.

---

## 💸 Built to Be 100% Free

No one pays anything to build, run, or use this — not you, not a recruiter, not anyone who forks it. It's built entirely on generous free tiers:

| What it does | Powered by |
|---|---|
| Hosting | Vercel (Hobby plan) |
| Database & search | Supabase (PostgreSQL + pgvector) |
| File storage | Supabase Storage |
| Login | Supabase Auth |
| The AI itself | Google Gemini |
| Fair-use rate limiting | Upstash Redis |
| Email delivery | Resend |

---

## 🚀 Get Your Own Running in Minutes

Click below to deploy your own copy straight to Vercel — you'll be prompted for a handful of free API keys (steps for getting each one are right below):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fyour-repo-name&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,GEMINI_API_KEY,GEMINI_CHAT_MODEL,GEMINI_EMBEDDING_MODEL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,RESEND_API_KEY,NEXT_PUBLIC_APP_URL)

No coding experience needed for this part — if you can copy and paste an API key, you can get this running.

---

## 🛠️ Full Setup Guide

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
```

### 2. Set up Supabase (your database, login, and file storage)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your new project's dashboard.
3. Copy the entire contents of `supabase/migrations/20260815_init.sql` from this repo, paste it in, and click **Run**.
   - This sets up every table the app needs, turns on vector search, and creates a private, locked-down storage bucket for resumes.
4. Go to **Project Settings → API** and copy these three values — you'll need them in step 6:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Get a free Google Gemini API key
1. Visit [Google AI Studio](https://aistudio.google.com).
2. Click **Get API key** — it's free.
3. That's your `GEMINI_API_KEY`.

> **Note:** Google occasionally retires older Gemini model versions. This app never hardcodes a model name — if a model you're using gets discontinued, just update the `GEMINI_CHAT_MODEL` environment variable to a current one and redeploy. No code changes needed. See [Troubleshooting](#-troubleshooting-gemini-model-changes) below.

### 4. Set up Upstash Redis (keeps usage fair for everyone)
1. Create a free database at [upstash.com](https://upstash.com).
2. Copy your `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

### 5. Set up Resend (for emailing transcripts)
1. Create a free account at [resend.com](https://resend.com).
2. Copy your `RESEND_API_KEY`.
3. **Heads up:** until you verify your own domain with Resend, you can only send test emails to your own Resend account email — not to other recipients. This is fine for trying the app out. For real use, verify a domain in the Resend dashboard so emails can reach any recruiter. Either way, a downloadable PDF is always available as a fallback, so nothing depends on email working.

### 6. Add your environment variables
```bash
cp .env.example .env.local
```
Then fill in `.env.local` with the values you collected above:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

GEMINI_API_KEY=AIzaSy...
GEMINI_CHAT_MODEL=gemini-3.1-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 7. Run it locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and you're in.

---

## 🔧 Troubleshooting: Gemini Model Changes

Google updates its Gemini model lineup fairly often (recent examples: 2.0 → 2.5 → 3.x, each with its own retirement date). If you ever see an error like `model is not found`, it almost always means the model name in your environment variables has been retired.

**Fix:** update `GEMINI_CHAT_MODEL` (and, less often, `GEMINI_EMBEDDING_MODEL`) to a currently available model name — check [Google AI Studio](https://aistudio.google.com) or the [Gemini API model list](https://ai.google.dev/gemini-api/docs/models) for what's current — then redeploy. That's it. No code needs to change, because the app reads these from your environment rather than hardcoding them.

---

## ✅ Running the Test Suite

```bash
npm test
```

This covers the two guarantees the whole product depends on, plus core parsing logic:
- **Isolation** — one candidate's data can never leak into another candidate's avatar.
- **Fair usage limits** — session and daily rate limits are enforced correctly.
- **Document parsing** — PDF, DOCX, YAML, and Markdown resumes are parsed and cited correctly.

To confirm a production build works before deploying:
```bash
npm run build
```

---

## 🤝 Contributing

This project is open source because it's meant to help job seekers, not just showcase a build. If you spot a bug, have an idea, or want to add a feature, issues and pull requests are welcome.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Use it, fork it, deploy your own, and pay nothing to do so.