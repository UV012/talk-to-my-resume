'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, ArrowRight } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  // If on recruiter interview surface (/u/[slug]), show focused recruiter navigation
  if (pathname.startsWith('/u/')) {
    return (
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '12px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size="sm" textVariant="full" />
          </Link>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Live Recruiter Interview Mode
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '68px',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo size="md" textVariant="full" />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!loading && (
            <>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link href="/dashboard" className="btn btn-primary btn-sm">
                    <User size={15} />
                    <span>My Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-secondary btn-sm"
                    title="Sign Out"
                    style={{ padding: '6px 10px' }}
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link href="/login" className="btn btn-secondary btn-sm">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn btn-primary btn-sm">
                    <span>Create Avatar</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
