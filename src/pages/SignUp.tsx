import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              Velocity AI
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-screen pt-16">
        {/* Left Section - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 flex-col justify-center px-12 py-20">
          <div className="max-w-md">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              <span className="text-blue-600">AI-Powered Workforce Intelligence</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
              Join thousands of teams
              <span className="block italic bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                driving real outcomes
              </span>
            </h2>

            <p className="text-lg text-slate-600 mb-8">
              Start optimizing your workforce today. Eliminate operational overhead and focus on what truly drives business value.
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              {[
                'No credit card required',
                '14-day free trial access',
                'Enterprise-grade security'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex lg:w-1/2 items-center justify-center px-4 py-20 sm:px-6 lg:px-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Get Started</h1>
              <p className="text-slate-600">Create your account to start the 14-day free trial</p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Email confirmation sent!</p>
                  <p className="text-sm text-green-800 mt-1">{success}</p>
                  <p className="text-sm text-green-700 mt-2">
                    Once confirmed, you can <Link to="/login" className="underline font-semibold hover:text-green-900">sign in here</Link>.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-900">{error}</p>
              </div>
            )}

            {/* Google Sign Up Button */}
            {!success && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="h-11 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold gap-2 flex items-center justify-center rounded-lg transition-colors text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleJiraSignUp}
                  disabled={loading}
                  className="h-11 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold gap-2 flex items-center justify-center rounded-lg transition-colors text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0 14c-3.314 0-6-1.343-6-3s2.686-3 6-3 6 1.343 6 3-2.686 3-6 3z"
                      fill="#0052CC"
                    />
                  </svg>
                  <span className="hidden sm:inline">Jira</span>
                </Button>
              </div>
            )}

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or create with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-2">At least 8 characters recommended</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Already have an account?</span>
                </div>
              </div>

              <Link
                to="/login"
                className="block text-center h-11 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center transition"
              >
                Sign In
              </Link>
            </form>

            {/* Footer Text */}
            {!success && (
              <p className="text-center text-xs text-slate-500 mt-6">
              By signing up, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
