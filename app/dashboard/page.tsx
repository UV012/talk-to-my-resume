'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  FileText,
  MessageSquare,
  Users,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [avatars, setAvatars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTargetRole, setNewTargetRole] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      const res = await fetch('/api/avatars');
      if (res.ok) {
        const data = await res.json();
        setAvatars(data.avatars || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: newTargetRole.trim(),
          slug: newSlug.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setNewTargetRole('');
        setNewSlug('');
        router.push(`/dashboard/avatars/${data.avatar.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create avatar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const copyShareLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/u/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const totalSessions = avatars.reduce((sum, a) => sum + (a.chat_sessions?.[0]?.count || 0), 0);
  const totalDocs = avatars.reduce((sum, a) => sum + (a.knowledge_sources?.[0]?.count || 0), 0);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 0 80px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Candidate Studio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage your AI interview avatars, review uploaded knowledge bases, and inspect recruiter briefs.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>New Avatar</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            <Sparkles size={16} color="var(--primary)" />
            <span>Active Avatars</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{avatars.length}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            <Users size={16} color="var(--accent-teal)" />
            <span>Recruiter Interviews</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{totalSessions}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            <FileText size={16} color="var(--warning)" />
            <span>Knowledge Documents</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800 }}>{totalDocs}</div>
        </div>
      </div>

      {/* Avatars List */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Your Avatars</h2>

        {avatars.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Logo size="xl" showText={false} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Avatars Created Yet</h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                maxWidth: '460px',
                margin: '0 auto 24px',
              }}
            >
              Create your first avatar, upload your resume or project notes, and start sharing your personalized link with recruiters.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create Your First Avatar</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {avatars.map((avatar) => {
              const statusClass =
                avatar.status === 'published'
                  ? 'badge-published'
                  : avatar.status === 'paused'
                  ? 'badge-paused'
                  : 'badge-draft';

              const docCount = avatar.knowledge_sources?.[0]?.count || 0;
              const sessionCount = avatar.chat_sessions?.[0]?.count || 0;

              return (
                <div key={avatar.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '17px', marginBottom: '4px' }}>
                        {avatar.target_role || 'General Candidate Avatar'}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        /u/{avatar.slug}
                      </div>
                    </div>
                    <span className={`badge ${statusClass}`} style={{ textTransform: 'capitalize' }}>
                      {avatar.status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '12px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      margin: '12px 0',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={15} />
                      <span>{docCount} {docCount === 1 ? 'doc' : 'docs'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={15} />
                      <span>{sessionCount} {sessionCount === 1 ? 'interview' : 'interviews'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {avatar.status === 'published' && (
                        <>
                          <button
                            onClick={() => copyShareLink(avatar.slug)}
                            className="btn btn-secondary btn-sm"
                            title="Copy Public Link"
                          >
                            {copiedSlug === avatar.slug ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                            <span>{copiedSlug === avatar.slug ? 'Copied' : 'Copy'}</span>
                          </button>
                          <Link
                            href={`/u/${avatar.slug}`}
                            target="_blank"
                            className="btn btn-secondary btn-sm"
                            title="Open Public Chat"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </>
                      )}
                    </div>

                    <Link href={`/dashboard/avatars/${avatar.id}`} className="btn btn-primary btn-sm">
                      <span>Studio</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Avatar Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Create Candidate Avatar</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Define the target role and unique share handle for your avatar.
            </p>

            <form onSubmit={handleCreateAvatar}>
              <div className="input-group">
                <label className="label" htmlFor="role">
                  Target Role / Professional Title
                </label>
                <input
                  id="role"
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Senior Full-Stack Engineer, Product Lead"
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="slug">
                  Custom Share URL Handle (Slug)
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-medium)',
                      borderRight: 'none',
                      borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    /u/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    className="input"
                    placeholder="alex-doe"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Leave empty to generate automatically from your name.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Creating...' : 'Create & Open Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
