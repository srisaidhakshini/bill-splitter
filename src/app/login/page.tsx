'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

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
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Full-screen background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      {/* Subtle dark overlay so card pops */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Sign-in card — Microsoft style */}
      <main className="relative z-10 w-full max-w-[440px] mx-4 bg-white shadow-2xl" style={{ padding: '44px 44px 36px' }}>

        {/* App icon */}
        <div className="mb-6">
          <div className="w-9 h-9 rounded-md bg-[#0058be] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">payments</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-[#1a1a1a] font-semibold mb-1" style={{ fontSize: '24px', lineHeight: '32px' }}>
          Sign in
        </h1>
        <p className="text-[#424242] text-sm mb-8">
          to continue to <span className="font-semibold">Oceanic Split</span>
        </p>

        {/* Google button */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 border border-[#d6d6d6] text-[#1a1a1a] text-sm font-medium hover:bg-[#f5f5f5] active:bg-[#ebebeb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg text-[#0058be]">progress_activity</span>
              <span>Redirecting to Google…</span>
            </>
          ) : (
            <>
              {/* Official Google G */}
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <p className="text-[#ba1a1a] text-xs mb-4">{error}</p>
        )}

        {/* Divider */}
        <div className="border-t border-[#ebebeb] my-4" />

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#0058be] hover:underline cursor-pointer" onClick={() => {}}>
            Privacy &amp; Terms
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="px-5 py-2 bg-[#0058be] text-white text-sm font-semibold hover:bg-[#0047a3] active:bg-[#003d8f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading…' : 'Next'}
          </button>
        </div>
      </main>
    </div>
  );
}
