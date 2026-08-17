'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, LogOut, ArrowRight, Sparkles } from 'lucide-react';
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
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-surface-container-high/60 py-3 transition-all">
        <div className="max-w-container-max mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="no-underline">
            <Logo size="sm" textVariant="full" />
          </Link>
          <div className="font-mono text-xs text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Recruiter Interview Surface</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-surface-container-high/60 transition-all">
      <div className="max-w-container-max mx-auto px-6 md:px-12 flex justify-between items-center h-16">
        <Link href="/" className="no-underline">
          <Logo size="md" textVariant="full" />
        </Link>

        <nav className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="btn btn-primary btn-sm">
                    <User size={14} />
                    <span>My Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-secondary btn-sm px-2.5"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
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
