import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ArrowLeft, MailCheck } from 'lucide-react';
import AuthLayout from '@/components/shared/AuthLayout';
import { FormError, validators } from '@/components/shared/FormError';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const { resetPassword } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    const err = validators.email(email);
    setEmailError(err || '');
    if (err) return;

    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-[#F0FDF4] rounded-full p-4">
              <MailCheck className="h-10 w-10 text-[#16A34A]" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-[#1C1917] mb-3 tracking-tight">
            Check your email
          </h1>
          <p className="text-[#78716C] font-normal mb-8 leading-relaxed">
            We've sent a password reset link to <span className="font-medium text-[#1C1917]">{email}</span>. 
            Please check your inbox and follow the instructions.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full h-11 rounded-lg border-[#E7E5E4] hover:bg-[#FAFAF9] transition-all">
              Return to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-10 text-center lg:text-left">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <div className="lg:hidden flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-[#1C1917] rounded-xl p-2 shadow-md">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="font-medium text-[#292524] text-xl">Velocity AI</span>
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-[#1C1917] mb-3 tracking-tight">
          Forgot password?
        </h1>
        <p className="text-[#78716C] font-normal">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-6">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-[#57534E] mb-1.5 block">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => { 
              setEmail(e.target.value); 
              if (attempted) setEmailError(validators.email(e.target.value) || ''); 
            }}
            disabled={loading}
            className={`h-11 rounded-lg bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E] ${emailError ? 'border-[#BE123C] focus:ring-[#BE123C]/10' : 'border-[#E7E5E4]'}`}
          />
          <FormError message={emailError} />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#1C1917] hover:bg-[#292524] rounded-lg font-medium transition-all duration-300 text-white shadow-lg shadow-stone-900/10"
        >
          {loading ? 'Sending link...' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
