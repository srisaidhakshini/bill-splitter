'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length > 0) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ba1a1a', '#4059aa', '#007cb1', '#0058be'];
  return { score, label: labels[score - 1] || '', color: colors[score - 1] || '' };
}

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  const strength = getPasswordStrength(password);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Please enter your full name.';
    if (!email.trim()) errs.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'Please enter a password.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('user already exists')) {
        setErrors({ email: 'This email is already registered. Please log in instead.' });
      } else {
        setGlobalError(`Supabase Error: ${signUpError.message}`);
      }
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[50%] bg-[#89ceff] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[60%] bg-[#dce9ff] rounded-full blur-[150px]" />
      </div>

      <main className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Brand Messaging */}
        <section className="hidden lg:flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2170e4] flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
            <h1 className="font-bold text-[#0b1c30]" style={{ fontSize: '36px' }}>Oceanic Split</h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-[#0058be] font-semibold max-w-md" style={{ fontSize: '28px', lineHeight: '36px' }}>
              Effortless finance for modern shared living.
            </h2>
            <p className="text-[#424754] max-w-lg text-base leading-relaxed">
              Join thousands of flatmates who manage shared expenses, track utility bills, and settle debts with clarity and calm.
            </p>
          </div>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden ocean-card">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0058be] to-[#00628d] flex items-center justify-center">
              <div className="text-center text-white">
                <span className="material-symbols-outlined text-6xl mb-4">account_balance_wallet</span>
                <p className="text-lg font-semibold">Smart bill splitting</p>
                <p className="text-sm opacity-80 mt-1">Real data, real balances</p>
              </div>
            </div>
            <div className="absolute bottom-6 left-6 text-white">
              <div className="flex -space-x-2 mb-3">
                {['RS', 'AM', 'NP'].map((initials, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-[#2170e4] flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#d3e4fe] flex items-center justify-center text-[10px] font-bold text-[#0b1c30]">
                  +24k
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Trusted by users worldwide</p>
            </div>
          </div>
        </section>

        {/* Right: Signup Form */}
        <section className="flex justify-center">
          <div className="ocean-card p-8 rounded-3xl w-full max-w-[480px] animate-fade-in">
            <header className="mb-6">
              <h2 className="font-semibold text-[#0b1c30]" style={{ fontSize: '24px', lineHeight: '32px' }}>Create Account</h2>
              <p className="text-[#424754] text-sm mt-1">Get started with your shared finance journey today.</p>
            </header>

            <form onSubmit={handleSignUp} className="space-y-4" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-xs font-semibold text-[#424754]">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]" style={{ fontSize: '20px' }}>person</span>
                  <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Riya Sharma" className="form-input" style={{ paddingLeft: '3rem' }} />
                </div>
                {errors.fullName && <p className="text-[#ba1a1a] text-xs">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-[#424754]">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]" style={{ fontSize: '20px' }}>mail</span>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="form-input" style={{ paddingLeft: '3rem' }} />
                </div>
                {errors.email && <p className="text-[#ba1a1a] text-xs">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-[#424754]">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]" style={{ fontSize: '20px' }}>lock</span>
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" className="form-input" style={{ paddingLeft: '3rem', paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727785] hover:text-[#0058be] transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="pt-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= strength.score ? strength.color : '#e5eeff' }} />
                      ))}
                    </div>
                    <p className="text-[10px] mt-1 font-semibold uppercase" style={{ color: strength.color }}>Strength: {strength.label}</p>
                  </div>
                )}
                {errors.password && <p className="text-[#ba1a1a] text-xs">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#424754]">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]" style={{ fontSize: '20px' }}>verified_user</span>
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Type your password again" className="form-input" style={{ paddingLeft: '3rem' }} />
                </div>
                {errors.confirmPassword && <p className="text-[#ba1a1a] text-xs">{errors.confirmPassword}</p>}
              </div>

              {/* Global Error */}
              {globalError && (
                <div className="flex items-start gap-2 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-lg mt-0.5">error</span>
                  <p className="text-[#93000a] text-sm">{globalError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#0058be] text-white font-semibold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-[#0058be]/90"
                style={{ fontSize: '16px' }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <footer className="mt-6 text-center">
              <p className="text-[#424754] text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0058be] font-bold hover:underline">Log In</Link>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
