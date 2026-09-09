'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bubbleContainerRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  // Bubble animation
  useEffect(() => {
    const container = bubbleContainerRef.current;
    if (!container) return;
    const createBubble = () => {
      const bubble = document.createElement('div');
      bubble.classList.add('bubble');
      const size = Math.random() * 40 + 10;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}vw`;
      bubble.style.animationDuration = `${Math.random() * 5 + 5}s`;
      bubble.style.opacity = String(Math.random() * 0.5);
      container.appendChild(bubble);
      setTimeout(() => bubble.remove(), 10000);
    };
    const interval = setInterval(createBubble, 800);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success, Supabase redirects the browser to Google — no further action needed
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ocean-bg">
        <div ref={bubbleContainerRef} />
        <div className="fixed bottom-0 left-0 w-full opacity-20 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,181.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z" fill="#0058be" />
          </svg>
        </div>
      </div>

      <main className="w-full max-w-md auth-card rounded-2xl p-8 md:p-10 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2170e4] text-white mb-4">
            <span className="material-symbols-outlined text-4xl">payments</span>
          </div>
          <h1 className="text-[#adc6ff] font-bold" style={{ fontSize: '28px', lineHeight: '36px' }}>Oceanic Split</h1>
          <p className="text-[#424754] text-sm mt-2">Clear, equitable, and reliable finance for flatmates.</p>
        </div>

        {/* Google Sign-In */}
        <div className="space-y-4">
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border border-[#e5eeff] bg-white text-[#0b1c30] font-semibold text-sm hover:bg-[#f8f9ff] hover:border-[#adc6ff] active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl text-[#0058be]">progress_activity</span>
                Redirecting to Google…
              </>
            ) : (
              <>
                {/* Google logo SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-lg mt-0.5">error</span>
              <p className="text-[#93000a] text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#727785] mt-8">
          By signing in, you agree to our terms. Your Google account name and photo will be used as your profile.
        </p>
      </main>
    </div>
  );
}
