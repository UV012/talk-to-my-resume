import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI Candidate Avatar | Interactive First-Person AI Interviews',
  description:
    'Turn your resume and supporting documents into an interactive first-person AI avatar that recruiters can interview asynchronously in real time.',
  keywords: ['AI Candidate Avatar', 'AI Resume', 'Async Interview', 'Recruiter Chatbot', 'Career Avatar'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            padding: '24px 0',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <strong>AI Candidate Avatar</strong> — Open-source & 100% Free-Tier Architecture (MIT)
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link href="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary)' }}>Candidate Dashboard</Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-secondary)' }}
              >
                GitHub Repository
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
