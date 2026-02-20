import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, CheckCircle2, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (container: HTMLElement | null, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, signInWithGoogle, signInWithJira, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      // Save email to Supabase if provided
      if (email.trim()) {
        await saveEmailInterest(email);
      }
      // signInWithGoogle() redirects to Google, which redirects back to /auth/callback
      // AuthCallback will handle the redirect to /velocity-ai
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  const handleJiraSignUp = () => {
    try {
      setLoading(true);
      setError('');
      // Save email to Supabase if provided
      if (email.trim()) {
        saveEmailInterest(email);
      }
      // signInWithJira() redirects to Jira OAuth, which redirects back to /velocity-ai
      signInWithJira();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Jira');
      setLoading(false);
    }
  };

  const saveEmailInterest = async (emailAddress: string) => {
    try {
      console.log('[Email Interest] Attempting to save:', emailAddress);
      const { data, error } = await supabase
        .from('email_interests')
        .insert([
          {
            email: emailAddress,
            source: 'signup_form',
            created_at: new Date().toISOString(),
          }
        ]);
      if (error) {
        console.error('[Email Interest] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('[Email Interest] Successfully saved:', data);
      }
    } catch (err) {
      console.error('[Email Interest] Unexpected error:', err);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      // Save email interest before signing up
      await saveEmailInterest(email);
      
      await signUp(email, password);
      setSuccess('Account created! Please check your email (including spam folder) to confirm your account before logging in.');
      // Don't redirect automatically - let user see the email confirmation message
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* LEFT PANEL - BRANDING (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        {/* Abstract Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[128px]"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-600/20 blur-[128px]"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-lg shadow-fuchsia-500/20">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Velocity <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">AI</span>
          </span>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-bold tracking-wide text-white uppercase backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Get Started Today
          </div>
          <h2 className="mb-8 text-4xl font-black leading-tight text-white">
            Start optimizing your workforce.
          </h2>
          
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/20">
                <CheckCircle2 className="h-5 w-5 text-fuchsia-400" />
              </div>
              <p className="text-sm font-bold text-slate-300">AI-driven scheduling and capacity planning</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                <CheckCircle2 className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-slate-300">Intelligent redeployment recommendations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                <CheckCircle2 className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm font-bold text-slate-300">Seamless Jira & Hubspot integrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - AUTH FORM */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Velocity <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500">AI</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Create an account</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Join thousands of leaders optimizing their workforce.</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-emerald-900">Check your email</h3>
              </div>
              <p className="text-sm font-medium text-emerald-800 leading-relaxed mb-4">{success}</p>
              <Link to="/login">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {/* Social Auth Buttons */}
              <div className="mb-8 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading || authLoading}
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  onClick={handleJiraSignUp}
                  disabled={loading || authLoading}
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                    <path d="M112.565 67.587c-17.72 17.753-17.72 46.541 0 64.283 17.712 17.741 46.46 17.741 64.181 0L247.96 60.672c8.473-8.474 8.473-22.258 0-30.743L225.86 7.842c-8.474-8.475-22.213-8.475-30.71 0L112.565 67.587z" fill="#2684FF"/>
                    <path d="M21.577 158.46c-17.741 17.73-17.741 46.495 0 64.237 17.72 17.731 46.493 17.731 64.214 0l71.213-71.198c8.474-8.474 8.474-22.247 0-30.72L134.906 98.67c-8.486-8.475-22.225-8.475-30.72 0L21.577 158.46z" fill="#2684FF"/>
                    <path d="M67.06 67.587c-17.73-17.73-46.494-17.73-64.214 0-17.742 17.741-17.742 46.54 0 64.283L74.06 203.067c8.473 8.474 22.224 8.474 30.72 0l22.098-22.087c8.474-8.474 8.474-22.246 0-30.72L67.06 67.587z" fill="#0052CC"/>
                  </svg>
                  Jira
                </Button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
                  <span className="bg-white px-3 text-slate-400">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-fuchsia-500 focus-visible:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                    <span className="text-xs font-medium text-slate-400">Min. 8 characters</span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-fuchsia-500 focus-visible:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-bold text-slate-700 ml-1">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus-visible:ring-fuchsia-500 focus-visible:bg-white transition-all shadow-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-slate-900 hover:text-fuchsia-600 transition-colors underline underline-offset-4 decoration-slate-300 hover:decoration-fuchsia-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}