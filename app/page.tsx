'use client';

import Link from 'next/link';
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Share2,
  Mail,
  ArrowRight,
  CheckCircle2,
  Download,
  Cpu,
  Zap,
  Layers,
  MessageSquare,
  Bot,
  ExternalLink,
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Background Subtle Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary-light/40 via-surface-container/30 to-transparent blur-3xl rounded-full opacity-70" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-secondary-container/20 blur-3xl rounded-full opacity-50" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-container-max mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Luminous Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                <span className="font-mono text-[11px] font-medium tracking-wider uppercase text-primary">
                  AI Candidate Avatar 2.0 • 100% Free Tier
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-on-surface leading-[1.12]">
                The Intelligent Intermediary for Modern Recruitment.
              </h1>

              {/* Sub-headline / Description */}
              <p className="text-lg md:text-xl text-on-surface-variant font-normal leading-relaxed max-w-xl">
                Upload your resume and project notes. We generate a strictly grounded, interactive AI chatbot avatar of yourself that recruiters can interview in real time, asynchronously and on demand.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/signup"
                  className="btn btn-primary btn-lg shadow-electric hover:shadow-lg transition-all"
                >
                  <span>Create Your Candidate Avatar</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  className="btn btn-secondary btn-lg"
                >
                  Candidate Studio
                </Link>
              </div>

              {/* Value Proposition Micro-Pills */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-on-surface-variant font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-secondary" />
                  No recruiter login required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-secondary" />
                  Zero hallucination guarantee
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-secondary" />
                  Emailed scorecard & PDF brief
                </span>
              </div>
            </div>

            {/* Hero Right Column: Floating Frosted Chat Simulation Card */}
            <div className="lg:col-span-5 relative">
              {/* Outer Glowing Decorative Backing */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/20 to-secondary-container/30 rounded-3xl blur-xl -z-10 transform rotate-1 scale-105" />

              <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-white/80 p-6 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300">
                {/* Simulated Chat Header */}
                <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-surface-tint text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      <Bot size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">Alex Doe&apos;s AI Avatar</div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Grounded in Verified Resume
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    LIVE PREVIEW
                  </span>
                </div>

                {/* Simulated Chat Messages */}
                <div className="space-y-4 text-xs md:text-sm">
                  {/* Recruiter Question */}
                  <div className="flex justify-end">
                    <div className="bg-primary-container text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[88%] shadow-sm">
                      <p className="leading-relaxed">
                        Can you describe your experience designing distributed microservices and handling high throughput?
                      </p>
                    </div>
                  </div>

                  {/* Avatar Answer */}
                  <div className="flex justify-start">
                    <div className="bg-surface-container-low text-on-surface border border-surface-container-highest/60 px-4 py-3.5 rounded-2xl rounded-tl-sm max-w-[92%] space-y-2 leading-relaxed">
                      <p>
                        At TechFlow, I architected the transition to event-driven Go microservices, handling over <strong>45,000 requests/sec</strong> with sub-35ms p99 latency.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="cite-chip">Resume §Experience</span>
                        <span className="cite-chip">techflow_case_study.yaml</span>
                      </div>
                    </div>
                  </div>

                  {/* Thinking / Live Indicator */}
                  <div className="flex items-center gap-1.5 pt-1 text-on-surface-variant font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />
                    <span>Real-time citation verification active</span>
                  </div>
                </div>

                {/* Bottom Card Footer Banner */}
                <div className="mt-5 pt-3 border-t border-surface-container-high/60 flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-primary" />
                    <span>Automated scorecard & PDF on completion</span>
                  </div>
                  <Link href="/signup" className="text-primary font-semibold hover:underline flex items-center gap-1">
                    Try now <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4-Step Feature Grid ("Precision Engineered Hiring") */}
      <section className="py-20 md:py-28 bg-surface-container-low/50 relative border-y border-surface-container-high/40">
        <div className="max-w-container-max mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface">
              Precision Engineered Candidate Screening
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              Our platform replaces tedious screening with intelligent automation, giving you more time to build meaningful connections with top candidates.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-surface-container-high p-8 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  1. Deep Document Ingestion
                </h3>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-6">
                  Upload your resume (PDF/DOCX) plus supplementary knowledge (YAML, Markdown, project STAR breakdowns). Our parser extracts grounded facts into vector embeddings.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Resume Parsing
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  YAML & Markdown
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  HNSW Vector Index
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-surface-container-high p-8 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  2. Automated Safety & Grounding Check
                </h3>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-6">
                  Before publishing, our adversarial probe tests edge cases (salary expectations, unlisted tech stacks) to guarantee zero hallucinations and strictly grounded responses.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Adversarial Probe
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Zero Hallucination
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Strict Citations
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-surface-container-high p-8 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Share2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  3. Asynchronous Shareable Link
                </h3>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-6">
                  Share your public slug (<code className="text-primary font-semibold">/u/your-name</code>) on job applications, LinkedIn, or emails. Recruiters chat instantly without needing an account.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Instant Access
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Optional HR Email
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Sliding Rate Limit
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-surface-container-high p-8 shadow-glass-card hover:shadow-glass-card-hover transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-6 group-hover:scale-110 transition-transform">
                  <Download size={24} />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  4. Topic Scorecards & PDF Briefs
                </h3>
                <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-6">
                  When the interview concludes, both candidate and recruiter receive an objective topic coverage matrix, grounded claims log, and downloadable PDF transcript.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Topic Matrix
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  PDF Brief
                </span>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  Email Dispatch
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-container-max mx-auto px-6 md:px-12 lg:px-16">
          <div className="bg-gradient-to-br from-[#004ac6] via-[#1d4ed8] to-[#0f172a] rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            {/* Luminous Glow Orbs in Background */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-mono tracking-wider uppercase">
                <Zap size={13} className="text-yellow-300" />
                Zero Cost • MIT Open Source
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight !text-white" style={{ color: '#ffffff' }}>
                Ready to transform your candidate screening?
              </h2>

              <p className="text-base sm:text-lg text-blue-100/90 leading-relaxed">
                Empower recruiters to interview your verified background 24/7 with zero scheduling delays and complete factual confidence.
              </p>

              <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
                <Link
                  href="/signup"
                  className="bg-white text-primary font-bold px-8 py-3.5 rounded-lg shadow-lg hover:bg-slate-50 transition-all text-sm md:text-base inline-flex items-center gap-2"
                >
                  <span>Create Your Candidate Avatar</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  className="btn bg-white/15 hover:bg-white/25 !text-white hover:!text-white font-semibold px-6 py-3.5 rounded-lg border border-white/40 backdrop-blur-sm transition-all text-sm md:text-base shadow-sm"
                  style={{ color: '#ffffff' }}
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-container-high/60 py-10 bg-surface text-on-surface-variant text-xs">
        <div className="max-w-container-max mx-auto px-6 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" textVariant="full" />
            <span className="text-outline">|</span>
            <span className="font-mono text-[11px]">Built for the future of asynchronous hiring</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/login" className="hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-primary transition-colors">
              Sign Up
            </Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
          </div>

          <div className="text-outline font-mono text-[11px]">
            © {new Date().getFullYear()} AI Candidate Avatar • MIT License
          </div>
        </div>
      </footer>
    </div>
  );
}
