'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  PauseCircle,
  FileText,
  Mail,
  User,
  Building,
  Briefcase,
  RefreshCw,
  X,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage, Scorecard, CitationReference } from '@/types/database';
import Logo from '@/components/Logo';
import { stripCitationTags } from '@/lib/format';
import ReactMarkdown from 'react-markdown';

interface AvatarPublicMeta {
  id: string;
  slug: string;
  status: string;
  visibility: string;
  target_role: string | null;
  candidate_name: string;
}

interface EmailDeliveryState {
  recruiterEmailAttempted: boolean;
  recruiterEmailSent: boolean;
  candidateEmailAttempted: boolean;
  candidateEmailSent: boolean;
}

export default function RecruiterChatPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  // Metadata Loading State
  const [avatarMeta, setAvatarMeta] = useState<AvatarPublicMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Session & Avatar State
  const [session, setSession] = useState<any | null>(null);
  const [avatarInfo, setAvatarInfo] = useState<any | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState<EmailDeliveryState | null>(null);

  // Capture Form State
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterCompany, setRecruiterCompany] = useState('');
  const [recruiterTargetRole, setRecruiterTargetRole] = useState('');
  const [startingSession, setStartingSession] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [remainingCount, setRemainingCount] = useState(20);
  const [rateLimitExceeded, setRateLimitExceeded] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationReference | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch avatar metadata on load to check visibility & status
  useEffect(() => {
    const fetchAvatarMeta = async () => {
      try {
        setMetaLoading(true);
        const res = await fetch(`/api/avatars/by-slug/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          setMetaError(data.error || 'Candidate avatar not found.');
        } else {
          setAvatarMeta(data);
        }
      } catch (err: any) {
        setMetaError('Unable to connect to candidate avatar service.');
      } finally {
        setMetaLoading(false);
      }
    };

    fetchAvatarMeta();
  }, [slug]);

  const isPermissioned = avatarMeta?.visibility === 'permissioned';

  // Start Session via Capture Form
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartingSession(true);
    setCaptureError(null);

    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          recruiter_name: recruiterName.trim(),
          recruiter_email: recruiterEmail.trim() || undefined,
          recruiter_company: recruiterCompany.trim() || undefined,
          recruiter_target_role: recruiterTargetRole.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCaptureError(data.error || 'Unable to start session.');
        return;
      }

      setSession(data.session);
      setAvatarInfo(data.avatar);

      const targetRoleMention = recruiterTargetRole.trim()
        ? ` for the "${recruiterTargetRole.trim()}" role`
        : data.avatar.target_role
        ? ` representing them for ${data.avatar.target_role} roles`
        : '';

      // Initial welcoming greeting from avatar
      const initialGreeting: ChatMessage = {
        id: 'initial-greeting',
        session_id: data.session.id,
        role: 'avatar',
        content: `Hello ${recruiterName.trim()}! I am ${data.avatar.candidate_name}'s AI Candidate Avatar${targetRoleMention}. I'm ready to answer any questions about my work history, technical proficiencies, or past projects!`,
        citations: [],
        created_at: new Date().toISOString(),
      };

      setMessages([initialGreeting]);
    } catch (err: any) {
      setCaptureError(err.message || 'Failed to start interview.');
    } finally {
      setStartingSession(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sendingMessage || !session || sessionEnded) return;

    const userText = inputValue.trim();
    setInputValue('');

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: session.id,
      role: 'hr',
      content: userText,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setSendingMessage(true);
    setRateLimitExceeded(null);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          message: userText,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRateLimitExceeded(data.error);
        return;
      }

      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setRemainingCount(data.remainingMessages ?? 0);
      } else {
        alert(data.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  // End Interview Session
  const handleEndInterview = async () => {
    if (!session || sessionEnded) return;
    if (!confirm('Are you ready to end the interview? Your interview summary and scorecard PDF will be generated for download.')) {
      return;
    }

    try {
      const res = await fetch('/api/chat/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setScorecard(data.scorecard);
        setPdfUrl(data.pdfDownloadUrl);
        setEmailDelivery(data.emailDelivery || null);
        setSessionEnded(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to generate scorecard.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Loading and Error States
  if (metaLoading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Connecting to candidate avatar...</p>
        </div>
      </div>
    );
  }

  if (metaError || !avatarMeta) {
    return (
      <div className="container-sm" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Avatar Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {metaError || 'This candidate avatar could not be located.'}
          </p>
          <Link href="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (avatarMeta.status === 'paused') {
    return (
      <div className="container-sm" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <PauseCircle size={36} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Avatar Paused</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {avatarMeta.candidate_name}&apos;s avatar is currently paused by the candidate and is not accepting interviews.
          </p>
          <Link href="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (avatarMeta.status === 'draft') {
    return (
      <div className="container-sm" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Avatar in Draft Mode</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {avatarMeta.candidate_name}&apos;s avatar is in draft setup and has not been published yet.
          </p>
          <Link href="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* 1. Recruiter Capture Form Modal */}
      {!session && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
                <Logo size="lg" showText={false} />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>
                Interview {avatarMeta.candidate_name}&apos;s Avatar
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {avatarMeta.target_role ? `Specialized in ${avatarMeta.target_role}. ` : ''}
                Start a real-time text interview grounded in verified candidate background.
              </p>
            </div>

            {isPermissioned && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#fdf4ff',
                  border: '1px solid #f0abfc',
                  color: '#86198f',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Permissioned Access:</strong> This candidate has restricted access. An authorized email address is required to proceed.
                </span>
              </div>
            )}

            {captureError && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{captureError}</span>
              </div>
            )}

            <form onSubmit={handleStartSession}>
              <div className="input-group">
                <label className="label" htmlFor="recruiterName">
                  Your Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recruiterName"
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Sarah Jenkins"
                    value={recruiterName}
                    onChange={(e) => setRecruiterName(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                  <User
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="label" htmlFor="recruiterEmail">
                  {isPermissioned ? (
                    <>
                      Your Email Address <span style={{ color: 'var(--danger)' }}>*</span>
                    </>
                  ) : (
                    'Your Email Address (Optional)'
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recruiterEmail"
                    type="email"
                    required={isPermissioned}
                    className="input"
                    placeholder="sarah@company.com"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Mail
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {isPermissioned
                    ? 'Required for candidate allow-list verification.'
                    : 'Optional. If provided, we’ll email you the interview summary brief & PDF.'}
                </span>
              </div>

              <div className="input-group">
                <label className="label" htmlFor="recruiterCompany">
                  Company / Organization (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recruiterCompany"
                    type="text"
                    className="input"
                    placeholder="Acme Staffing"
                    value={recruiterCompany}
                    onChange={(e) => setRecruiterCompany(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Building
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="label" htmlFor="recruiterTargetRole">
                  Target Role / Position under Consideration (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recruiterTargetRole"
                    type="text"
                    className="input"
                    placeholder="e.g. Lead Backend Engineer"
                    value={recruiterTargetRole}
                    onChange={(e) => setRecruiterTargetRole(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Briefcase
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={startingSession}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              >
                {startingSession ? 'Connecting to Avatar...' : 'Start Interview Session'}
                {!startingSession && <ArrowRight size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Active Chat Surface */}
      {session && !sessionEnded && (
        <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px', maxWidth: '900px' }}>
          {/* Header Bar */}
          <div
            className="card"
            style={{
              padding: '16px 24px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '18px', margin: 0 }}>
                {avatarInfo?.candidate_name}&apos;s AI Avatar
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {session.recruiter_target_role ? `Inquiring for: ${session.recruiter_target_role} | ` : avatarInfo?.target_role ? `Target Role: ${avatarInfo.target_role} | ` : ''}
                Interviewing as: <strong>{session.recruiter_name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {remainingCount} messages remaining
              </div>
              <button onClick={handleEndInterview} className="btn btn-secondary btn-sm">
                End & Receive Brief
              </button>
            </div>
          </div>

          {/* Rate Limit Alert */}
          {rateLimitExceeded && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'var(--warning-light)',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                color: '#92400e',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{rateLimitExceeded}</span>
              <button onClick={handleEndInterview} className="btn btn-primary btn-sm">
                Generate Scorecard
              </button>
            </div>
          )}

          {/* Conversation Stream */}
          <div
            className="card"
            style={{
              flex: 1,
              minHeight: '440px',
              maxHeight: '600px',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {messages.map((msg, idx) => {
              const isAvatar = msg.role === 'avatar';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isAvatar ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isAvatar ? 'var(--primary)' : 'var(--text-muted)',
                      marginBottom: '4px',
                      textAlign: isAvatar ? 'left' : 'right',
                    }}
                  >
                    {isAvatar ? `${avatarInfo?.candidate_name}'s Avatar` : session.recruiter_name}
                  </div>
                  <div
                    style={{
                      backgroundColor: isAvatar ? 'var(--primary-light)' : 'var(--bg-dark)',
                      color: isAvatar ? '#1e3a8a' : '#ffffff',
                      padding: '14px 18px',
                      borderRadius: isAvatar ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                    }}
                  >
                    <div className="chat-markdown">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'inherit', textDecoration: 'underline' }}
                            />
                          ),
                        }}
                      >
                        {stripCitationTags(msg.content)}
                      </ReactMarkdown>
                    </div>

                    {/* Citations Footer */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitation(c)}
                            className="cite-chip"
                            style={{ border: 'none', cursor: 'pointer' }}
                          >
                            [source #{cIdx + 1}]
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sendingMessage && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <RefreshCw size={14} className="animate-spin" />
                <span>Candidate Avatar is formulating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input"
              placeholder="Ask about past projects, technical stack, or background..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={sendingMessage || remainingCount <= 0}
              style={{ fontSize: '15px', padding: '14px 18px' }}
            />
            <button
              type="submit"
              disabled={sendingMessage || !inputValue.trim() || remainingCount <= 0}
              className="btn btn-primary"
              style={{ padding: '0 24px' }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* 3. Post-Session Completion View */}
      {sessionEnded && scorecard && (
        <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
          <div className="card" style={{ padding: '36px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Interview Session Completed</h1>
              
              {session.recruiter_email && emailDelivery?.recruiterEmailSent ? (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Your post-interview summary brief and PDF report have been emailed to <strong>{session.recruiter_email}</strong>. You can also download a copy directly below.
                </p>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Your interview is complete. Download your official interview summary and scorecard PDF below.
                </p>
              )}
            </div>

            {/* Topic Coverage */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Topic Coverage Matrix</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(scorecard.topic_coverage).map(([topic, covered]) => (
                  <span
                    key={topic}
                    className="badge"
                    style={{
                      backgroundColor: covered ? 'var(--success-light)' : 'var(--bg-muted)',
                      color: covered ? 'var(--success)' : 'var(--text-muted)',
                      fontSize: '13px',
                      padding: '6px 12px',
                    }}
                  >
                    {covered ? '[x]' : '[ ]'} {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Evidence */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Grounded Claims & Evidence</h3>
              {scorecard.key_evidence.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No explicit factual claims recorded.</p>
              ) : (
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scorecard.key_evidence.map((ev, i) => (
                    <li key={i} style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      <strong>{ev.claim}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Source: {ev.source_citation}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Open Questions */}
            {scorecard.open_questions.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Open / Unlisted Questions</h3>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {scorecard.open_questions.map((q, i) => (
                    <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download PDF Button */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" className="btn btn-primary btn-lg">
                  <Download size={18} />
                  <span>Download Interview Summary (PDF)</span>
                </a>
              )}
              <Link href="/" className="btn btn-secondary btn-lg">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Citation Popover Modal */}
      {activeCitation && (
        <div className="modal-backdrop" onClick={() => setActiveCitation(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>
                Grounded Source Citation
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {activeCitation.citation}
            </div>

            {activeCitation.section && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Section: {activeCitation.section}
              </div>
            )}

            <div
              style={{
                backgroundColor: 'var(--bg-muted)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                lineHeight: 1.6,
                fontFamily: 'var(--font-mono)',
              }}
            >
              &quot;{activeCitation.snippet || 'Grounded source passage'}&quot;
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
