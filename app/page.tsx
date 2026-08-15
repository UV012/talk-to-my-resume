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
  Lock,
  Cpu,
  Download,
  Flame,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '80px 0 60px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% -20%, rgba(37, 99, 235, 0.12), transparent 70%)',
        }}
      >
        <div className="container-sm">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '20px',
            }}
          >
            <Sparkles size={15} />
            <span>Open Source & 100% Free-Tier Architecture</span>
          </div>

          <h1
            style={{
              fontSize: '44px',
              lineHeight: 1.15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '20px',
              letterSpacing: '-0.03em',
            }}
          >
            Your First-Person AI Interview Avatar for Recruiters
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
          >
            Upload your resume and project notes. We generate a strictly grounded, interactive AI chatbot avatar of yourself that recruiters can interview in real-time, asynchronously and on-demand.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '40px',
            }}
          >
            <Link href="/signup" className="btn btn-primary btn-lg">
              <span>Create Your Candidate Avatar</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              Candidate Studio
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 500,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> No recruiter login required
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Zero hallucination guarantee
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Emailed scorecard & PDF brief
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Mock Walkthrough */}
      <section className="container" style={{ marginBottom: '80px' }}>
        <div
          className="card"
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '32px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                AD
              </div>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0 }}>Alex Doe (Senior Full-Stack Engineer)</h3>
                <span className="badge badge-published" style={{ marginTop: '4px' }}>
                  Live Recruiter Preview
                </span>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Public Share URL: <code style={{ color: 'var(--primary)' }}>/u/alex-doe</code>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Recruiter (Sarah Jenkins, Acme Staffing)
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  padding: '12px 16px',
                  borderRadius: '12px 12px 12px 2px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}
              >
                Can you tell me about your experience designing distributed microservices and database sharding?
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', textAlign: 'right', marginBottom: '4px' }}>
                Alex Doe&apos;s AI Avatar
              </div>
              <div
                style={{
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid #bfdbfe',
                  padding: '14px 18px',
                  borderRadius: '12px 12px 2px 12px',
                  fontSize: '14px',
                  color: '#1e3a8a',
                  lineHeight: 1.6,
                }}
              >
                In my last role at TechFlow, I architected our transition from a monolithic Rails backend to event-driven Go microservices, handling over 45k req/sec with PostgreSQL horizontal partitioning{' '}
                <span className="cite-chip">Resume, Experience §2</span>. I also implemented distributed tracing using OpenTelemetry to maintain sub-50ms p99 latency{' '}
                <span className="cite-chip">techflow_case_study.yaml</span>.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={18} color="var(--primary)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Session concludes with automated topic coverage, grounded citations, and PDF sent to both emails.
              </span>
            </div>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Try It With Your Resume
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step How It Works Grid */}
      <section className="container" style={{ marginBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>How AI Candidate Avatar Works</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Built specifically to solve high-friction scheduling and asynchronous screening for both job seekers and hiring teams.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
          }}
        >
          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>1. Upload Documents</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Upload your resume (PDF/DOCX) plus optional supplementary context (YAML, Markdown, project STAR write-ups).
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--warning-light)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>2. Automated Safety Check</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Our pre-publish adversarial probe tests salary questions and absent skills to flag any ungrounded claims before you go live.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-teal-light)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Share2 size={22} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>3. Share Public Link</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Get your custom link (<code style={{ color: 'var(--primary)' }}>/u/your-name</code>). Recruiters chat immediately without needing an account.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Download size={22} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>4. Emailed Brief & PDF</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Both you and the recruiter receive a factual topic coverage brief and downloadable PDF transcript after every session.
            </p>
          </div>
        </div>
      </section>

      {/* Free Tier Architecture Section */}
      <section className="container" style={{ marginBottom: '60px' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-dark)',
            color: 'var(--text-inverse)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 32px',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <Cpu size={16} />
              <span>Zero-Cost Infrastructure Stack</span>
            </div>
            <h2 style={{ fontSize: '32px', color: '#ffffff', marginBottom: '16px' }}>
              Free to Run. Free to Share. Free for Recruiters.
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>
              Built from the ground up for Vercel, Supabase (Postgres + pgvector + RLS), Google Gemini Flash, Upstash Redis sliding window rate limits, and Resend email delivery.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link href="/dashboard" className="btn btn-secondary btn-lg" style={{ backgroundColor: 'transparent', color: '#fff', borderColor: '#475569' }}>
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
