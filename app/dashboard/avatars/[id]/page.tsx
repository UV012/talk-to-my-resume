'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Play,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Send,
  Download,
  Users,
  Eye,
  RefreshCw,
  Lock,
  Globe,
  Link2,
} from 'lucide-react';
import { Avatar, KnowledgeSource, Scorecard, ChatSession, ChatMessage } from '@/types/database';
import { stripCitationTags } from '@/lib/format';
import ReactMarkdown from 'react-markdown';

export default function AvatarStudioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const avatarId = params.id;

  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'knowledge' | 'sandbox' | 'safety' | 'sessions'>('knowledge');
  const [copiedLink, setCopiedLink] = useState(false);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'resume' | 'supplement'>('resume');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sandbox Chat State
  const [sandboxMessages, setSandboxMessages] = useState<any[]>([]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxSending, setSandboxSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState<any | null>(null);

  // Safety Probes State
  const [probes, setProbes] = useState<any[]>([]);
  const [runningProbes, setRunningProbes] = useState(false);

  // Visibility & Settings State
  const [visibility, setVisibility] = useState<'public' | 'link_only' | 'permissioned'>('public');
  const [permissionedEmailsText, setPermissionedEmailsText] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Sessions Review State
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [selectedSessionMessages, setSelectedSessionMessages] = useState<ChatMessage[]>([]);
  const [loadingSessionDetails, setLoadingSessionDetails] = useState(false);

  const fetchAvatarData = async () => {
    try {
      const res = await fetch(`/api/avatars/${avatarId}`);
      if (res.ok) {
        const data = await res.json();
        setAvatar(data.avatar);
        setVisibility(data.avatar.visibility || 'public');
        setPermissionedEmailsText((data.avatar.permissioned_emails || []).join(', '));
        setProbes(data.avatar.publish_checks || []);
        setSessions(data.avatar.chat_sessions || []);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatarData();
  }, [avatarId]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', selectedFileType);

    try {
      const res = await fetch(`/api/avatars/${avatarId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchAvatarData();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete Knowledge Source
  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge source and all its indexed chunks?')) return;

    try {
      const res = await fetch(`/api/avatars/${avatarId}/sources/${sourceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAvatarData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Adversarial Safety Probes
  const handleRunProbes = async () => {
    setRunningProbes(true);
    try {
      const res = await fetch(`/api/avatars/${avatarId}/probe`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setProbes(data.checks || []);
      } else {
        const err = await res.json();
        alert(err.error || 'Probe run failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningProbes(false);
    }
  };

  // Toggle Publish / Pause
  const handleStatusChange = async (newStatus: 'published' | 'paused' | 'draft') => {
    try {
      const res = await fetch(`/api/avatars/${avatarId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchAvatarData();
      } else {
        const err = await res.json();
        alert(err.error || 'Status update failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Visibility Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    const emailList = permissionedEmailsText
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/avatars/${avatarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility,
          permissioned_emails: emailList,
        }),
      });

      if (res.ok) {
        await fetchAvatarData();
        alert('Visibility settings updated successfully.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Delete Avatar
  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to permanently delete this avatar? All files, chunks, transcripts, and scorecards will be deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/avatars/${avatarId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Sandbox Chat Message
  const handleSendSandboxMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxInput.trim() || sandboxSending) return;

    const userText = sandboxInput.trim();
    setSandboxInput('');
    const newMsgList = [...sandboxMessages, { role: 'hr', content: userText, citations: [] }];
    setSandboxMessages(newMsgList);
    setSandboxSending(true);

    try {
      // In sandbox mode, initialize or use a mock chat endpoint
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `sandbox-${avatarId}`,
          message: userText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSandboxMessages([...newMsgList, data.message]);
      } else {
        // Mock reply if sandbox session is virtual
        setSandboxMessages([
          ...newMsgList,
          {
            role: 'avatar',
            content: `I am speaking in character based on your uploaded resume. Feel free to ask about any specific project, skill, or experience!`,
            citations: [{ citation: 'Resume Summary', section: 'Overview', snippet: 'Sandbox testing context' }],
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSandboxSending(false);
    }
  };

  const copyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/u/${avatar?.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading avatar studio...
      </div>
    );
  }

  if (!avatar) return null;

  const knowledgeSources: KnowledgeSource[] = avatar.knowledge_sources || [];
  const hasFlaggedProbes = probes.some((p) => p.flagged);

  return (
    <div className="container" style={{ padding: '32px 0 80px' }}>
      {/* Back Link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={15} />
        <span>Back to Dashboard</span>
      </Link>

      {/* Studio Header Bar */}
      <div
        className="card"
        style={{
          padding: '24px 32px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', margin: 0 }}>
              {avatar.target_role || 'General Candidate Avatar'}
            </h1>
            <span
              className={`badge ${
                avatar.status === 'published'
                  ? 'badge-published'
                  : avatar.status === 'paused'
                  ? 'badge-paused'
                  : 'badge-draft'
              }`}
              style={{ textTransform: 'capitalize' }}
            >
              {avatar.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Share Link:</span>
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--bg-muted)',
                padding: '3px 8px',
                borderRadius: '4px',
                color: 'var(--primary)',
              }}
            >
              /u/{avatar.slug}
            </code>
            <button onClick={copyShareLink} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px' }}>
              {copiedLink ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
            {avatar.status === 'published' && (
              <Link href={`/u/${avatar.slug}`} target="_blank" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px' }}>
                <ExternalLink size={13} />
                <span>Open Chat</span>
              </Link>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {avatar.status === 'published' ? (
            <button onClick={() => handleStatusChange('paused')} className="btn btn-secondary">
              Pause Avatar
            </button>
          ) : avatar.status === 'paused' ? (
            <button onClick={() => handleStatusChange('published')} className="btn btn-primary">
              Resume Avatar
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('published')}
              disabled={knowledgeSources.length === 0}
              className="btn btn-primary"
            >
              <Globe size={16} />
              <span>Publish Avatar</span>
            </button>
          )}

          <button onClick={handleDeleteAvatar} className="btn btn-danger btn-sm" title="Delete Avatar">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '28px',
        }}
      >
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`btn ${activeTab === 'knowledge' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
        >
          <FileText size={16} />
          <span>Knowledge Base ({knowledgeSources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`btn ${activeTab === 'sandbox' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
        >
          <Play size={16} />
          <span>Sandbox Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`btn ${activeTab === 'safety' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
        >
          <ShieldCheck size={16} />
          <span>Safety & Publishing</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0', borderBottom: 'none' }}
        >
          <Users size={16} />
          <span>Recruiter Briefs ({sessions.length})</span>
        </button>
      </div>

      {/* TAB 1: KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upload Card */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Upload Resume & Supporting Documents</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Upload your main resume (PDF, DOCX, or text) and optional supplementary documents (PDF, DOCX, YAML, Markdown, STAR project write-ups).
            </p>

            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap',
                padding: '24px',
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-muted)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="label">Document Category</label>
                <select
                  className="select"
                  value={selectedFileType}
                  onChange={(e: any) => setSelectedFileType(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="resume">Main Resume</option>
                  <option value="supplement">Supplementary Doc / Notes</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <label className="label">Select File (PDF, DOCX, YAML, Markdown, TXT)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.yaml,.yml,.md,.markdown,.txt"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="input"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                />
              </div>

              {uploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '13px' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Parsing sections & generating Gemini embeddings...</span>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="card">
            <h3 style={{ fontSize: '17px', marginBottom: '16px' }}>Uploaded Knowledge Sources</h3>
            {knowledgeSources.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No documents uploaded yet. Please upload your resume to generate your avatar.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {knowledgeSources.map((source) => (
                  <div
                    key={source.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={20} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{source.original_filename}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Type: <strong style={{ textTransform: 'capitalize' }}>{source.file_type}</strong> | Added: {new Date(source.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete Source"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SANDBOX CHAT */}
      {activeTab === 'sandbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px' }}>
          {/* Chat Console */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '540px', padding: '0' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-muted)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              Candidate Sandbox Test (Test your Avatar in First-Person Mode)
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {sandboxMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '13px' }}>
                  Ask a question to test how your avatar responds (e.g. &quot;What is your background?&quot; or &quot;Tell me about your experience with microservices&quot;).
                </div>
              )}

              {sandboxMessages.map((msg, i) => {
                const isAvatar = msg.role === 'avatar';
                return (
                  <div
                    key={i}
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
                      {isAvatar ? 'Your AI Avatar' : 'You (Recruiter Simulation)'}
                    </div>
                    <div
                      style={{
                        backgroundColor: isAvatar ? 'var(--primary-light)' : 'var(--bg-dark)',
                        color: isAvatar ? '#1e3a8a' : '#ffffff',
                        padding: '12px 16px',
                        borderRadius: '12px',
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

                      {/* Render Citation Chips */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {msg.citations.map((c: any, cIdx: number) => (
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
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendSandboxMessage}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '16px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <input
                type="text"
                className="input"
                placeholder="Ask your avatar a question..."
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                disabled={sandboxSending}
              />
              <button type="submit" disabled={sandboxSending || !sandboxInput.trim()} className="btn btn-primary">
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Citation Inspector */}
          <div className="card" style={{ height: '540px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Citation Inspector</h3>
            {activeCitation ? (
              <div style={{ fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                  {activeCitation.citation}
                </div>
                {activeCitation.section && (
                  <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Section: {activeCitation.section}
                  </div>
                )}
                <div
                  style={{
                    backgroundColor: 'var(--bg-muted)',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                  }}
                >
                  &quot;{activeCitation.snippet || 'Referenced grounding chunk'}&quot;
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Click on any [source #] chip in the chat window to inspect which document section was retrieved.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY & PUBLISHING */}
      {activeTab === 'safety' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Adversarial Probes Runner */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Automated Pre-Publish Adversarial Safety Check</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Tests probing questions (salary expectation, plausible unlisted skills, failure stories) to verify that your avatar does not hallucinate facts.
                </p>
              </div>
              <button
                onClick={handleRunProbes}
                disabled={runningProbes || knowledgeSources.length === 0}
                className="btn btn-primary"
              >
                {runningProbes ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Running Probes...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Run Safety Check</span>
                  </>
                )}
              </button>
            </div>

            {hasFlaggedProbes && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--warning-light)',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-md)',
                  color: '#92400e',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={18} />
                <span>
                  <strong>Grounding Warnings Detected:</strong> One or more probe responses asserted ungrounded claims. You can add extra context in your knowledge base or acknowledge and proceed to publish.
                </span>
              </div>
            )}

            {probes.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                Click &quot;Run Safety Check&quot; to execute the automated grounding evaluation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {probes.map((probe, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      backgroundColor: probe.flagged ? '#fffbeb' : 'var(--bg-muted)',
                      border: `1px solid ${probe.flagged ? '#fde68a' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        Probe #{idx + 1}: {probe.probe_question}
                      </div>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: probe.flagged ? 'var(--danger-light)' : 'var(--success-light)',
                          color: probe.flagged ? 'var(--danger)' : 'var(--success)',
                        }}
                      >
                        {probe.flagged ? 'Warning Flagged' : 'Grounded & Verified'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Avatar Reply:</strong> {probe.avatar_answer}
                    </div>

                    {probe.flag_reason && (
                      <div style={{ fontSize: '12px', color: '#92400e', fontStyle: 'italic' }}>
                        Reason: {probe.flag_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility & Access Rules */}
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Visibility & Recruiter Access Control</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Control who can initiate an asynchronous interview with your avatar.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div className="input-group">
                <label className="label">Access Visibility</label>
                <select
                  className="select"
                  value={visibility}
                  onChange={(e: any) => setVisibility(e.target.value)}
                  style={{ maxWidth: '300px' }}
                >
                  <option value="public">Public (Anyone with link can interview)</option>
                  <option value="link_only">Link Only (Unlisted public link)</option>
                  <option value="permissioned">Permissioned (Only specific recruiter emails)</option>
                </select>
              </div>

              {visibility === 'permissioned' && (
                <div className="input-group">
                  <label className="label">Allowed Recruiter Emails (comma-separated)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="recruiter@company.com, sarah@talent.org"
                    value={permissionedEmailsText}
                    onChange={(e) => setPermissionedEmailsText(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Only recruiters entering one of these verified emails will be allowed past the capture form.
                  </span>
                </div>
              )}

              <button type="submit" disabled={savingSettings} className="btn btn-primary" style={{ marginTop: '8px' }}>
                {savingSettings ? 'Saving...' : 'Save Visibility Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: RECRUITER SESSIONS & SCORECARDS */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Recruiter Interview Briefs</h2>
            {sessions.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                No recruiters have interviewed this avatar yet. Share your link ({`/u/${avatar.slug}`}) to start receiving interview briefs!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>
                        {sess.recruiter_name} {sess.recruiter_email ? `(${sess.recruiter_email})` : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sess.recruiter_company ? `Company: ${sess.recruiter_company} | ` : ''}
                        Messages: {sess.message_count} | Started: {new Date(sess.started_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`/api/sessions/${sess.id}/pdf`}
                        target="_blank"
                        className="btn btn-secondary btn-sm"
                        title="Download PDF Brief"
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
