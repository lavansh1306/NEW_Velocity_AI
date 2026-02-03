import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

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

    try {
      await signUp(email, password);
      setSuccess('Account created! Please check your email to confirm your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
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

            <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
              Join thousands of teams<br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
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
                  <p className="font-medium text-green-900">{success}</p>
                  <p className="text-sm text-green-800 mt-1">Redirecting to login...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-900">{error}</p>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
