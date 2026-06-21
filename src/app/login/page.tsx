'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bubbleContainerRef = useRef<HTMLDivElement>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(`Supabase Error: ${authError.message}`);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ocean-bg">
        <div ref={bubbleContainerRef} />
        {/* Wave decoration */}
        <div className="fixed bottom-0 left-0 w-full opacity-20 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,181.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z" fill="#0058be" />
          </svg>
        </div>
      </div>

      <main className="w-full max-w-md auth-card rounded-2xl p-8 md:p-10 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2170e4] text-white mb-4">
            <span className="material-symbols-outlined text-4xl">payments</span>
          </div>
          <h1 className="text-[#adc6ff] font-bold" style={{ fontSize: '28px', lineHeight: '36px' }}>Oceanic Split</h1>
          <p className="text-[#424754] text-sm mt-2">Clear, equitable, and reliable finance for flatmates.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424754] group-focus-within:text-[#0058be] transition-colors" style={{ fontSize: '20px' }}>mail</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-xs font-semibold text-[#424754] uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424754] group-focus-within:text-[#0058be] transition-colors" style={{ fontSize: '20px' }}>lock</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#424754] hover:text-[#0b1c30] transition-colors p-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-lg mt-0.5">error</span>
              <p className="text-[#93000a] text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0058be] text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-[#0058be]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span className="material-symbols-outlined text-xl">login</span>
              </>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <div className="text-center mt-8 pt-6 border-t border-[#e5eeff]">
          <p className="text-[#424754] text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#0058be] font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
